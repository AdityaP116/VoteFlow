import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ── Provide safe fallback values so the app never crashes on load ──
const firebaseConfig = {
  apiKey: "AIzaSyB9E8JL0JnbxGZfPh9MKvOEfBZBjjfkTU8",
  authDomain: "parkflow-aea27.firebaseapp.com",
  projectId: "parkflow-aea27",
  storageBucket: "parkflow-aea27.firebasestorage.app",
  messagingSenderId: "780295868152",
  measurementId: "G-1063MH4QXY"
};

let app;
let auth;

try {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.warn("[VoteFlow] Firebase init skipped (demo mode):", e.message);
}

export { auth };

/**
 * Returns a Firebase ID token for the current anonymous session.
 * If Firebase is not configured (dev mode), returns a placeholder string.
 */
export async function getIdToken() {
  if (!auth) {
    console.warn("[VoteFlow] Firebase not configured — using demo token.");
    return "demo-token";
  }
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      try {
        if (!user) {
          const result = await signInAnonymously(auth);
          resolve(await result.user.getIdToken());
        } else {
          resolve(await user.getIdToken(false));
        }
      } catch (err) {
        console.warn("[VoteFlow] Anonymous auth failed — using demo token:", err.message);
        resolve("demo-token");
      }
    });
  });
}
