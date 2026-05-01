import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9E8JL0JnbxGZfPh9MKvOEfBZBjjfkTU8",
  authDomain: "parkflow-aea27.firebaseapp.com",
  projectId: "parkflow-aea27",
  storageBucket: "parkflow-aea27.firebasestorage.app",
  messagingSenderId: "780295868152",
  measurementId: "G-1063MH4QXY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInAnonymously(auth)
  .then((user) => {
    console.log("Success:", user.user.uid);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Firebase Error:", err.code, err.message);
    process.exit(1);
  });
