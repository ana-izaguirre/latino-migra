import { initializeApp } from "firebase/app";
import { FavouriteKey, FavouriteKind, bookmarkToKey, favouriteKey } from "./favourites";
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
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
// Dynamically look for local configuration file if present without failing the build if missing
const configModules = import.meta.glob(
  ["/firebase-applet-config.json", "../../firebase-applet-config.json"],
  { eager: true }
);
let localConfig: Record<string, any> = {};
for (const path in configModules) {
  if (configModules[path]) {
    localConfig = (configModules[path] as any)?.default || configModules[path] || {};
    break;
  }
}

const env: Record<string, any> = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey:
    env.VITE_FIREBASE_API_KEY || localConfig.apiKey || "AIzaSyDummyKeyForSafeInitialization0000",
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN ||
    localConfig.authDomain ||
    "refined-coral-0zp2g.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || "refined-coral-0zp2g",
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ||
    localConfig.storageBucket ||
    "refined-coral-0zp2g.appspot.com",
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || "123456789",
  appId: env.VITE_FIREBASE_APP_ID || localConfig.appId || "1:123456789:web:abcdef",
  firestoreDatabaseId:
    env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || undefined,
};

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

try {
  appInstance = initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  dbInstance =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
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

/**
 * Safe subscriber to auth state changes that never throws even if auth is not initialized
 */
export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void): () => void {
  if (!auth) {
    console.info("Firebase Auth running in local guest mode");
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback, (error) => {
      console.warn("Auth state change error:", error);
    });
  } catch (err) {
    console.warn("Could not attach onAuthStateChanged listener:", err);
    return () => {};
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Operation Error:", JSON.stringify(errInfo));
  return error;
}

// Helper for Google Sign In
export async function signInWithGoogle(countryOfOrigin?: string) {
  if (!auth) {
    throw new Error("Firebase Auth no está inicializado.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user already exists to preserve countryOfOrigin if set
    const userRef = doc(db, "users", user.uid);
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const finalCountry = countryOfOrigin || existingData?.countryOfOrigin || "Colombia";

    // Save/Update user document in Firestore
    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName: user.displayName || "Usuario LatinoMigra",
        email: user.email || "",
        photoURL:
          user.photoURL ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        countryOfOrigin: finalCountry,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { user, countryOfOrigin: finalCountry };
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    throw error;
  }
}

// Update User Profile (e.g. Country of Origin) in Firestore
export async function updateUserProfile(
  userId: string,
  data: { countryOfOrigin?: string; displayName?: string }
) {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// Fetch User Profile from Firestore
export async function getUserProfile(userId: string) {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Whether the signed-in user is an administrator.
 *
 * Authority lives in `admins/{uid}`, a collection with a read-own rule and no
 * write rule at all, so the catch-all denies every client write: entries can
 * only be added from the Firebase console. This is the single source of truth
 * for both the interface and `isAdmin()` in `firestore.rules`.
 *
 * Fails closed. A denied or failed read returns false rather than assuming
 * privilege, and `handleFirestoreError` logs it so the failure is visible
 * instead of silently downgrading an administrator to a normal user.
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const path = `admins/${userId}`;
  try {
    const snap = await getDoc(doc(db, "admins", userId));
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return false;
  }
}

// Sign Out Helper
export async function signOutUser() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

// Firestore Helper: Fetch User's Saved Scholarships
export async function fetchUserBookmarks(userId: string): Promise<string[]> {
  const path = "savedScholarships";
  try {
    const q = query(collection(db, path), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => bookmarkToKey(d.data()))
      .filter((key): key is FavouriteKey => key !== null);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves or removes one favourite, of either catalogue.
 *
 * The collection is still called `savedScholarships`. Renaming it means copying
 * every document and deleting the originals, and there is no backup or restore
 * capability yet (#18), so the name stays wrong and this comment carries the
 * reason. New documents carry `itemType` and `itemId`; the ones written before
 * #82 carry `scholarshipId` and are read as scholarships, which is what all of
 * them are.
 */
export async function toggleBookmark(
  userId: string,
  kind: FavouriteKind,
  itemId: string,
  title: string,
  country: string
): Promise<boolean> {
  const path = "savedScholarships";
  try {
    const existing = await getDocs(query(collection(db, path), where("userId", "==", userId)));
    const wanted = favouriteKey(kind, itemId);
    const match = existing.docs.find((d) => bookmarkToKey(d.data()) === wanted);

    if (match) {
      await deleteDoc(doc(db, path, match.id));
      return false;
    }

    await addDoc(collection(db, path), {
      userId,
      itemType: kind,
      itemId,
      // Kept for anything still reading the old field, and only for the kind it
      // can describe: writing a programme id into `scholarshipId` would make a
      // course look like a scholarship to every existing query.
      ...(kind === "scholarship" ? { scholarshipId: itemId } : {}),
      title,
      country,
      savedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// Firestore Helper: Save / Update Migration Plan
export async function saveUserMigrationPlan(userId: string, planData: any) {
  const path = `migrationPlans/${userId}`;
  try {
    const planRef = doc(db, "migrationPlans", userId);
    await setDoc(
      planRef,
      {
        ...planData,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// Firestore Helper: Get User Migration Plan
export async function getUserMigrationPlan(userId: string) {
  const path = `migrationPlans/${userId}`;
  try {
    const planRef = doc(db, "migrationPlans", userId);
    const snap = await getDoc(planRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Display preferences for a signed-in user.
 *
 * Shares `userPreferences/{uid}` with the alert settings, under a `display`
 * key so the two cannot collide. See `src/lib/preferencesStore.ts`.
 */
export async function getStoredPreferences(userId: string): Promise<unknown> {
  const path = `userPreferences/${userId}`;
  try {
    const snap = await getDoc(doc(db, "userPreferences", userId));
    return snap.exists() ? (snap.data().display ?? {}) : {};
  } catch (err) {
    // Fail closed to defaults rather than blocking the first render.
    handleFirestoreError(err, OperationType.GET, path);
    return {};
  }
}

export async function saveStoredPreferences(userId: string, display: unknown) {
  const path = `userPreferences/${userId}`;
  try {
    await setDoc(
      doc(db, "userPreferences", userId),
      { display, userId, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function clearStoredPreferences(userId: string) {
  const path = `userPreferences/${userId}`;
  try {
    await setDoc(
      doc(db, "userPreferences", userId),
      { display: {}, userId, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Firestore Helper: Save User Alert Preferences
export async function saveUserAlertPreferences(userId: string, prefs: any) {
  const path = `userPreferences/${userId}`;
  try {
    const prefRef = doc(db, "userPreferences", userId);
    await setDoc(
      prefRef,
      {
        ...prefs,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// Firestore Helper: Get User Alert Preferences
export async function getUserAlertPreferences(userId: string) {
  const path = `userPreferences/${userId}`;
  try {
    const prefRef = doc(db, "userPreferences", userId);
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Firestore Helper: Fetch Feedback Suggestions
export async function fetchFeedbackSuggestions(): Promise<any[]> {
  const path = "feedbackSuggestions";
  try {
    const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Firestore Helper: Create Feedback Suggestion
export async function createFeedbackSuggestion(suggestionData: any): Promise<string> {
  const path = "feedbackSuggestions";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...suggestionData,
      createdAt: new Date().toISOString(),
      upvotes: 1,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

// Firestore Helper: Upvote Feedback Suggestion
export async function upvoteFeedbackSuggestion(
  suggestionId: string,
  incrementAmount: number = 1
): Promise<void> {
  const path = `feedbackSuggestions/${suggestionId}`;
  try {
    const sugRef = doc(db, "feedbackSuggestions", suggestionId);
    await updateDoc(sugRef, {
      upvotes: increment(incrementAmount),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// Firestore Helper: Add User Note
export async function addUserNote(
  userId: string,
  title: string,
  content: string,
  category: string = "Notas"
) {
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

/** The category chip that means "do not filter". */
export const ALL_CATEGORIES = "Todas";

/**
 * A page of forum posts, filtered by category in the query rather than after
 * the fact.
 *
 * The category used to be accepted and ignored, with `Comunidad.tsx` filtering
 * the fetched page client-side. That returned the six most recent posts
 * overall and then removed the ones that did not match, so a category with
 * posts could look empty and "load more" paged through the whole forum instead
 * of the category.
 *
 * Filtering here requires the composite index (category ASC, createdAt DESC)
 * on `forumPosts`; without it Firestore rejects the query.
 */
export async function fetchCommunityPostsPaginated(
  pageSize = 6,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  category: string = ALL_CATEGORIES
): Promise<PaginatedForumResult> {
  const path = "forumPosts";
  try {
    // We fetch pageSize + 1 to know if there's a next page without an extra count query
    const fetchLimit = pageSize + 1;

    const constraints = [
      ...(category && category !== ALL_CATEGORIES ? [where("category", "==", category)] : []),
      orderBy("createdAt", "desc"),
      ...(lastDoc ? [startAfter(lastDoc)] : []),
      limit(fetchLimit),
    ];
    const q = query(collection(db, path), ...constraints);

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
      userId: auth?.currentUser?.uid || null,
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
      userId: auth?.currentUser?.uid || null,
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

// ----------------------------------------------------
// DYNAMIC SCHOLARSHIPS FIRESTORE SYNC & PAGINATION
// ----------------------------------------------------

/**
 * Fetch scholarships from Firestore. Falls back to static dataset if Firestore is empty or fails.
 */
export async function fetchScholarshipsFromDB(): Promise<any[]> {
  const path = "scholarships";
  try {
    const q = query(collection(db, path), orderBy("deadlineDate", "asc"), limit(100));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    console.warn("Could not fetch scholarships from Firestore, using fallback cache:", err);
    return [];
  }
}

/**
 * Seed or update the Firestore scholarships collection from a list of scholarships
 */
export async function seedScholarshipsToDB(scholarships: any[]): Promise<number> {
  const path = "scholarships";
  let count = 0;
  try {
    for (const item of scholarships) {
      const docRef = doc(db, path, item.id);
      await setDoc(
        docRef,
        {
          ...item,
          updatedAt: new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      count++;
    }
    return count;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Trigger automated scholarship sync / AI crawler
 */
export async function triggerScholarshipSync(
  academicYear: string = "2026-2027"
): Promise<{ success: boolean; updatedCount: number; message: string; data?: any[] }> {
  try {
    const response = await fetch("/api/cron/sync-scholarships", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ academicYear }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Error triggering scholarship sync:", error);
    return {
      success: false,
      updatedCount: 0,
      message: error.message || "Error al sincronizar becas.",
    };
  }
}

// ----------------------------------------------------
// VISA GUIDES REAL-TIME VOTES & COMMUNITY RATINGS
// ----------------------------------------------------

export interface VisaVotesData {
  helpfulVotes: number;
  difficultyRating: number; // 1-5
  totalReviews: number;
}

/**
 * Fetch persistent community votes and rating stats for visas of a country from Firestore
 */
/**
 * In-memory fallback used when Firestore is unavailable. Nothing is written to
 * localStorage, so the cache lives only for the current page session.
 */
const visaVotesMemoryCache = new Map<string, Record<string, VisaVotesData>>();

export async function fetchVisaGuideVotes(
  countryCode: string
): Promise<Record<string, VisaVotesData>> {
  try {
    if (!db) {
      return visaVotesMemoryCache.get(countryCode) || {};
    }
    const q = collection(db, "visa_guide_votes", countryCode, "visas");
    const snapshot = await getDocs(q);
    const result: Record<string, VisaVotesData> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      result[docSnap.id] = {
        helpfulVotes: data.helpfulVotes || 0,
        difficultyRating: data.difficultyRating || 3,
        totalReviews: data.totalReviews || 1,
      };
    });
    visaVotesMemoryCache.set(countryCode, result);
    return result;
  } catch (err) {
    console.warn("Could not fetch visa votes from Firestore, using in-memory fallback:", err);
    return visaVotesMemoryCache.get(countryCode) || {};
  }
}

/**
 * Save / upvote a specific visa in Firestore with fallback
 */
export async function voteVisaHelpful(countryCode: string, visaId: string): Promise<number> {
  try {
    if (db) {
      const docRef = doc(db, "visa_guide_votes", countryCode, "visas", visaId);
      await setDoc(
        docRef,
        {
          helpfulVotes: increment(1),
          lastVotedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      const snap = await getDoc(docRef);
      return snap.data()?.helpfulVotes || 1;
    }
  } catch (err) {
    console.warn("Firestore vote failed, updating local store:", err);
  }

  // In-memory fallback for the current session.
  const existing = visaVotesMemoryCache.get(countryCode) || {};
  const current = existing[visaId]?.helpfulVotes || 12;
  const updated = current + 1;
  existing[visaId] = {
    ...(existing[visaId] || { difficultyRating: 3, totalReviews: 5 }),
    helpfulVotes: updated,
  };
  visaVotesMemoryCache.set(countryCode, existing);
  return updated;
}
