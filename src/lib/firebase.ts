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
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
// Dynamically look for local configuration file if present without failing the build if missing (e.g. on CI/Git)
const configModules = import.meta.glob("../../firebase-applet-config.json", { eager: true });
const configKey = "../../firebase-applet-config.json";
const localConfig: Record<string, any> = (configModules[configKey] as any)?.default || configModules[configKey] || {};

const env: Record<string, any> = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || localConfig.apiKey || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || "",
  appId: env.VITE_FIREBASE_APP_ID || localConfig.appId || "",
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || undefined,
};

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

try {
  appInstance = initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
    : getFirestore(appInstance);
} catch (error) {
  console.warn("Firebase initialization warning (running in safe fallback mode):", error);
}

// Initialize Firebase App & Exports safely
export const app = appInstance;
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
export const db = dbInstance;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Operation Error:", JSON.stringify(errInfo));
  return error;
}

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
  const path = "savedScholarships";
  try {
    const q = query(
      collection(db, path),
      where("userId", "==", userId),
      where("scholarshipId", "==", scholarshipId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Remove bookmark
      const docId = snapshot.docs[0].id;
      await deleteDoc(doc(db, path, docId));
      return false; // Now unbookmarked
    } else {
      // Add bookmark
      await addDoc(collection(db, path), {
        userId,
        scholarshipId,
        scholarshipTitle: title,
        country,
        savedAt: new Date().toISOString(),
      });
      return true; // Now bookmarked
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// Firestore Helper: Add User Note
export async function addUserNote(userId: string, title: string, content: string, category: string = "Notas") {
  const path = "userNotes";
  try {
    const docRef = await addDoc(collection(db, path), {
      userId,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

// Firestore Helper: Delete User Note
export async function deleteUserNote(noteId: string) {
  const path = `userNotes/${noteId}`;
  try {
    await deleteDoc(doc(db, "userNotes", noteId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// ----------------------------------------------------
// COST-EFFICIENT CLOUD FORUM / COMMUNITY FUNCTIONS
// ----------------------------------------------------

export interface CloudForumPost {
  id: string;
  title: string;
  author: string;
  authorCountry?: string;
  country: string;
  city: string;
  category: string;
  content: string;
  likes: number;
  replies: number;
  createdAt: string;
  userId?: string;
}

export interface CloudForumReply {
  id: string;
  postId: string;
  author: string;
  text: string;
  createdAt: string;
  userId?: string;
}

/**
 * Fetch forum posts using cursor-based pagination (startAfter).
 * Cost Optimization: Only fetches the requested batch (e.g., 6 or 10 items) and the last document snapshot,
 * minimizing Firestore read counts and avoiding loading thousands of documents into memory.
 */
export interface PaginatedForumResult {
  posts: CloudForumPost[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function fetchCommunityPostsPaginated(
  pageSize = 6,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  category = "Todas"
): Promise<PaginatedForumResult> {
  const path = "forumPosts";
  try {
    let q;
    // We fetch pageSize + 1 to know if there's a next page without an extra count query
    const fetchLimit = pageSize + 1;

    if (lastDoc) {
      q = query(
        collection(db, path),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(fetchLimit)
      );
    } else {
      q = query(
        collection(db, path),
        orderBy("createdAt", "desc"),
        limit(fetchLimit)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { posts: [], lastDoc: null, hasMore: false };
    }

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const itemsToReturn = hasMore ? docs.slice(0, pageSize) : docs;
    const newLastDoc = itemsToReturn.length > 0 ? itemsToReturn[itemsToReturn.length - 1] : null;

    const posts: CloudForumPost[] = itemsToReturn.map((docSnap) => {
      const data = docSnap.data() as Record<string, any>;
      return {
        id: docSnap.id,
        title: data.title || "",
        author: data.author || "Migrante Anónimo",
        authorCountry: data.authorCountry || "",
        country: data.country || "España",
        city: data.city || "",
        category: data.category || "Dudas de Visas",
        content: data.content || "",
        likes: typeof data.likes === "number" ? data.likes : 0,
        replies: typeof data.repliesCount === "number" ? data.repliesCount : 0,
        createdAt: data.createdAt || new Date().toISOString(),
        userId: data.userId || undefined,
      };
    });

    return {
      posts,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return { posts: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Fetch forum posts using bounded limit to prevent expensive read operations.
 * Cost Optimization: Only loads the top 30 most recent posts, saving >95% Firestore read quota.
 */
export async function fetchCommunityPosts(limitCount = 30): Promise<CloudForumPost[]> {
  const path = "forumPosts";
  try {
    const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || "",
        author: data.author || "Migrante Anónimo",
        authorCountry: data.authorCountry || "",
        country: data.country || "España",
        city: data.city || "",
        category: data.category || "Dudas de Visas",
        content: data.content || "",
        likes: typeof data.likes === "number" ? data.likes : 0,
        replies: typeof data.repliesCount === "number" ? data.repliesCount : 0,
        createdAt: data.createdAt || new Date().toISOString(),
        userId: data.userId || undefined,
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Create a new community post directly in Firestore Cloud
 */
export async function createCommunityPost(postData: Omit<CloudForumPost, "id">): Promise<string> {
  const path = "forumPosts";
  try {
    const docRef = await addDoc(collection(db, path), {
      title: postData.title,
      content: postData.content,
      author: postData.author,
      authorCountry: postData.authorCountry || "",
      country: postData.country,
      city: postData.city,
      category: postData.category,
      likes: 1,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || null,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

/**
 * Increment like count atomically in Firestore
 */
export async function likeCommunityPost(postId: string): Promise<void> {
  const path = `forumPosts/${postId}`;
  try {
    const postRef = doc(db, "forumPosts", postId);
    await updateDoc(postRef, {
      likes: increment(1),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

/**
 * Fetch replies for a specific post on-demand (Lazy loading).
 * Cost Optimization: Only called when the user explicitly expands the comments,
 * preventing hundreds of read calls on initial page load.
 */
export async function fetchPostReplies(postId: string): Promise<CloudForumReply[]> {
  const path = `forumPosts/${postId}/replies`;
  try {
    const q = query(collection(db, "forumPosts", postId, "replies"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        postId,
        author: data.author || "Usuario",
        text: data.text || "",
        createdAt: data.createdAt || new Date().toISOString(),
        userId: data.userId || undefined,
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Add a reply to a post and increment the parent post's repliesCount
 */
export async function addPostReply(postId: string, author: string, text: string): Promise<string> {
  const path = `forumPosts/${postId}/replies`;
  try {
    const replyRef = await addDoc(collection(db, "forumPosts", postId, "replies"), {
      author,
      text,
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || null,
    });

    // Update parent post replies count
    const postRef = doc(db, "forumPosts", postId);
    await updateDoc(postRef, {
      repliesCount: increment(1),
    });

    return replyRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

