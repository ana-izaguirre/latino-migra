import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (using custom database ID if specified)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper for Google Sign In
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Save/Update user document in Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName: user.displayName || "Usuario LatinoMigra",
        email: user.email || "",
        photoURL:
          user.photoURL ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return user;
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    throw error;
  }
}

// Sign Out Helper
export async function signOutUser() {
  return firebaseSignOut(auth);
}

// Firestore Helper: Save Scholarship Bookmark
export async function toggleBookmarkScholarship(userId: string, scholarshipId: string, title: string, country: string) {
  try {
    const q = query(
      collection(db, "savedScholarships"),
      where("userId", "==", userId),
      where("scholarshipId", "==", scholarshipId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Remove bookmark
      const docId = snapshot.docs[0].id;
      await deleteDoc(doc(db, "savedScholarships", docId));
      return false; // Now unbookmarked
    } else {
      // Add bookmark
      await addDoc(collection(db, "savedScholarships"), {
        userId,
        scholarshipId,
        scholarshipTitle: title,
        country,
        savedAt: new Date().toISOString(),
      });
      return true; // Now bookmarked
    }
  } catch (err) {
    console.error("Error guardando beca:", err);
    throw err;
  }
}

// Firestore Helper: Add User Note
export async function addUserNote(userId: string, title: string, content: string, category: string = "Notas") {
  try {
    const docRef = await addDoc(collection(db, "userNotes"), {
      userId,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Error agregando nota:", err);
    throw err;
  }
}

// Firestore Helper: Delete User Note
export async function deleteUserNote(noteId: string) {
  try {
    await deleteDoc(doc(db, "userNotes", noteId));
  } catch (err) {
    console.error("Error eliminando nota:", err);
    throw err;
  }
}
