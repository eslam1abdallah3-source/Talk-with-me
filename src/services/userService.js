import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const createUserDocument = async (user, displayName = "") => {
  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (snap.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    name: displayName || user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    isOnline: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};
