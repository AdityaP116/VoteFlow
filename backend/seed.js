/**
 * seed.js — Run once to populate Firestore with sample data
 * Usage: node seed.js
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID env vars set
 */

require("dotenv").config();
const admin = require("firebase-admin");

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

const POLLING_BOOTHS = [
  {
    name: "Government High School, Thane West",
    address: "Station Road, Thane West, Thane 400601",
    constituency: "Thane Assembly (147)",
    state: "Maharashtra",
    city: "Thane",
    last_updated: "2025-01-15",
  },
  {
    name: "Municipal School No. 4, Andheri East",
    address: "Marol Maroshi Road, Andheri East, Mumbai 400059",
    constituency: "Andheri East Assembly (155)",
    state: "Maharashtra",
    city: "Mumbai",
    last_updated: "2025-01-15",
  },
  {
    name: "Government Girls Higher Secondary School",
    address: "Anna Salai, Chennai 600002",
    constituency: "Chepauk-Thiruvallikeni (6)",
    state: "Tamil Nadu",
    city: "Chennai",
    last_updated: "2025-02-01",
  },
  {
    name: "Kendriya Vidyalaya, Sector 12",
    address: "Sector 12, Dwarka, New Delhi 110075",
    constituency: "Dwarka Assembly (38)",
    state: "Delhi",
    city: "Dwarka",
    last_updated: "2025-01-20",
  },
  {
    name: "Rashtriya Vidyalaya, Basavangudi",
    address: "V.V. Road, Basavangudi, Bengaluru 560004",
    constituency: "Basavanagudi Assembly (151)",
    state: "Karnataka",
    city: "Bengaluru",
    last_updated: "2025-01-18",
  },
];

const DATA_CONFIDENCE = [
  { state: "Maharashtra", city: "Thane",   status: "SAFE",    total_score: 94, last_updated: "2025-01-15" },
  { state: "Maharashtra", city: "Mumbai",  status: "SAFE",    total_score: 97, last_updated: "2025-01-15" },
  { state: "Tamil Nadu",  city: "Chennai", status: "SAFE",    total_score: 91, last_updated: "2025-02-01" },
  { state: "Delhi",       city: "Dwarka",  status: "SAFE",    total_score: 89, last_updated: "2025-01-20" },
  { state: "Karnataka",   city: "Bengaluru", status: "SAFE",  total_score: 93, last_updated: "2025-01-18" },
  // Example blocked city:
  { state: "Uttar Pradesh", city: "Lucknow", status: "BLOCKED", total_score: 0, last_updated: "2025-01-01" },
];

async function seed() {
  console.log("🌱 Seeding Firestore...\n");

  // Seed polling_booths
  const boothBatch = db.batch();
  for (const booth of POLLING_BOOTHS) {
    const ref = db.collection("polling_booths").doc();
    boothBatch.set(ref, booth);
    console.log(`  ✅ Booth: ${booth.name}`);
  }
  await boothBatch.commit();

  // Seed data_confidence
  const confBatch = db.batch();
  for (const conf of DATA_CONFIDENCE) {
    const ref = db.collection("data_confidence").doc();
    confBatch.set(ref, conf);
    console.log(`  ${conf.status === "BLOCKED" ? "🔴" : "✅"} Confidence: ${conf.city}, ${conf.state} → ${conf.status}`);
  }
  await confBatch.commit();

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
