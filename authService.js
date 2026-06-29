import { auth } from "./firebaseConfig";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

/**
 * Configure local persistence for Firebase Auth.
 * This ensures users stay logged in across sessions/page refreshes.
 */
export const initAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Error setting auth persistence:", error);
    throw error;
  }
};

/**
 * Register a new user using email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").User>}
 */
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error during email sign-up:", error);
    throw error;
  }
};

/**
 * Sign in an existing user using email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").User>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error during email sign-in:", error);
    throw error;
  }
};

/**
 * Sign in/Up a user using Google OAuth via a popup window.
 * @returns {Promise<import("firebase/auth").User>}
 */
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw error;
  }
};

/**
 * Sign out the currently authenticated user.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during sign-out:", error);
    throw error;
  }
};

/**
 * Listen for changes in the user's authentication state.
 * @param {(user: import("firebase/auth").User | null) => void} callback 
 * @returns {import("firebase/auth").Unsubscribe} Unsubscribe function to stop listening
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
