import { vi, beforeEach } from "vitest";

// Server-side suites opt into the node environment, where none of the DOM
// setup below applies (and would throw). Everything DOM-specific is guarded.
const hasDom = typeof window !== "undefined";

if (hasDom) {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  const { afterEach } = await import("vitest");

  // Automatically clean up DOM after each test
  afterEach(() => {
    cleanup();
  });

  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock Firebase SDK
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: "mock-doc-id" })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  increment: vi.fn(),
  onSnapshot: vi.fn((query, cb) => {
    cb({ docs: [] });
    return () => {};
  }),
}));

/**
 * `preferencesStore` keeps its snapshot in module state, so without this a
 * preference set in one test leaks into the next — a stored country would
 * silently beat the one a test seeds through props, and the failure looks like
 * a component bug rather than shared state.
 */
beforeEach(async () => {
  if (!hasDom) return;
  document.cookie = "lm_prefs=; Path=/; Max-Age=0";
  const store = await import("../lib/preferencesStore");
  store.detachUser();
  store.initPreferences();
});
