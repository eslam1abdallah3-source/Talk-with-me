// Firebase Web Configuration
// Initialized using credentials from environment variables
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxwo6TnLeIRvu6rJMxip9TFhbtkdgXojM",
  authDomain: "english-circle-1234.firebaseapp.com",
  projectId: "english-circle-1234",
  storageBucket: "english-circle-1234.firebasestorage.app",
  messagingSenderId: "804482336402",
  appId: "1:804482336402:web:b8b9e36c44ccc3b182084b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
