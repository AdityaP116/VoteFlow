require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");

// ─── Firebase Admin Init ─────────────────────────────────────────────────────
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : serviceAccountRaw ? JSON.parse(serviceAccountRaw) : null;

if (!admin.apps.length) {
  const adminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
  };
  
  if (serviceAccount && Object.keys(serviceAccount).length > 0) {
    adminConfig.credential = admin.credential.cert(serviceAccount);
  } else {
    adminConfig.credential = admin.credential.applicationDefault();
  }
  
  admin.initializeApp(adminConfig);
}

const db = admin.firestore();

// ─── Express Setup ────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiter: 60 req / 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use(limiter);

// ─── JWT Middleware ───────────────────────────────────────────────────────────
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header." });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid Firebase token." });
  }
}

// ─── Helper: Build Evaluate Response ─────────────────────────────────────────
function buildEvaluateResponse(age, hasVoterId, recentlyMoved) {
  const normalized = String(hasVoterId).toLowerCase().trim();
  const timestamp = new Date().toISOString();

  if (age < 18) {
    return {
      status: "UNDERAGE",
      message:
        "You must be at least 18 years old to vote in India. Keep your documents ready — you can register 90 days before your 18th birthday.",
      next_actions: [
        "Wait until you turn 18",
        "Pre-apply on voters.eci.gov.in once you're 90 days away from turning 18",
      ],
      required_steps: [
        "Aadhaar Card or Birth Certificate for age proof",
        "Address proof (utility bill / bank passbook)",
        "Recent passport-size photograph",
      ],
      last_updated: timestamp,
      source: "Election Commission of India",
    };
  }

  if (normalized === "no" || normalized === "not_sure") {
    return {
      status: "ELIGIBLE_NOT_REGISTERED",
      message:
        normalized === "not_sure"
          ? "You may already be registered, but we cannot confirm it. We recommend verifying on the ECI portal and completing a fresh registration if needed."
          : "You are eligible to vote but are not yet registered. Register now to exercise your constitutional right.",
      next_actions: [
        "Visit voters.eci.gov.in to register online (Form 6)",
        "Visit your nearest BLO (Booth Level Officer) for offline registration",
        normalized === "not_sure"
          ? "Check your existing registration at electoralsearch.eci.gov.in"
          : null,
      ].filter(Boolean),
      required_steps: [
        "Aadhaar Card / Passport / Driving Licence for identity proof",
        "Address proof (utility bill / rent agreement / bank passbook)",
        "Recent passport-size photograph (white background)",
      ],
      last_updated: timestamp,
      source: "Election Commission of India",
    };
  }

  // hasVoterId === "yes"
  if (recentlyMoved) {
    return {
      status: "REGISTERED_MOVED",
      message:
        "You are registered but have recently moved. Update your address to ensure your name appears in the correct constituency's voter list.",
      next_actions: [
        "File Form 8A on voters.eci.gov.in to update your address",
        "Visit your local Electoral Registration Officer (ERO)",
        "Track your application status on the ECI portal",
      ],
      required_steps: [
        "Current address proof (utility bill / rental agreement)",
        "Your existing Voter ID card",
        "Aadhaar card (if address differs)",
      ],
      last_updated: timestamp,
      source: "Election Commission of India",
    };
  }

  return {
    status: "REGISTERED_VALID",
    message:
      "You are fully registered and your polling booth details are available. You're all set to vote!",
    next_actions: [
      "Download your e-EPIC (digital Voter ID) from voters.eci.gov.in",
      "Check your polling booth details below",
      "Carry your Voter ID / Aadhaar on election day",
    ],
    required_steps: [
      "Voter ID card (Voter ID / Aadhaar / Passport as valid alternatives)",
    ],
    last_updated: timestamp,
    source: "Election Commission of India",
  };
}

// ─── POST /evaluate ───────────────────────────────────────────────────────────
app.post("/evaluate", verifyFirebaseToken, async (req, res) => {
  try {
    const { age, state, city, hasVoterId, recentlyMoved } = req.body;

    // Input validation
    if (typeof age !== "number" || !state || !city || !hasVoterId) {
      return res.status(400).json({
        error: "Missing required fields: age (number), state, city, hasVoterId",
      });
    }
    if (!["yes", "no", "not_sure"].includes(String(hasVoterId).toLowerCase().trim())) {
      return res.status(400).json({
        error: "hasVoterId must be one of: yes, no, not_sure",
      });
    }

    const result = buildEvaluateResponse(
      Number(age),
      hasVoterId,
      Boolean(recentlyMoved)
    );

    // Log anonymized evaluation to Firestore (no PII stored)
    try {
      await db.collection("evaluations").add({
        uid: req.uid,
        state,
        city,
        status: result.status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logErr) {
      console.warn("Firestore log failed (non-fatal):", logErr.message);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in /evaluate:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /polling-booth ───────────────────────────────────────────────────────
app.get("/polling-booth", verifyFirebaseToken, async (req, res) => {
  try {
    const { state, city } = req.query;
    if (!state || !city) {
      return res.status(400).json({ error: "Query params 'state' and 'city' are required." });
    }

    // Step 1: Check data_confidence collection
    const confidenceSnap = await db
      .collection("data_confidence")
      .where("state", "==", state)
      .where("city", "==", city)
      .limit(1)
      .get();

    if (!confidenceSnap.empty) {
      const conf = confidenceSnap.docs[0].data();
      if (conf.status === "BLOCKED") {
        return res.status(200).json({
          status: "LOW_CONFIDENCE",
          message: "Polling data is currently unavailable for this location.",
          fallback_url: "https://eci.gov.in",
        });
      }
    }

    // Step 2: Fetch polling booth
    const boothSnap = await db
      .collection("polling_booths")
      .where("state", "==", state)
      .where("city", "==", city)
      .limit(1)
      .get();

    if (boothSnap.empty) {
      return res.status(200).json({
        status: "LOW_CONFIDENCE",
        message: "No polling booth data found for this location.",
        fallback_url: "https://eci.gov.in",
      });
    }

    const booth = boothSnap.docs[0].data();

    // Only expose safe fields — never full doc
    return res.status(200).json({
      status: "FOUND",
      booth: {
        booth_id: boothSnap.docs[0].id,
        name: booth.name || "N/A",
        address: booth.address || "N/A",
        constituency: booth.constituency || "N/A",
        state: booth.state,
        city: booth.city || city,
        last_updated: booth.last_updated || null,
      },
    });
  } catch (err) {
    console.error("Error in /polling-booth:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /health ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "voteflow-backend",
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve Frontend (Unified Deployment) ──────────────────────────────────────
const path = require("path");
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`VoteFlow backend running on port ${PORT}`);
});
