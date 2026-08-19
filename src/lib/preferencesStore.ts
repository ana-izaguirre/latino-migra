import { getStoredPreferences, saveStoredPreferences, clearStoredPreferences } from "./firebase";

/**
 * Persistence for the five display preferences.
 *
 * Two backends, chosen by whether anyone is signed in:
 *
 *   signed in  -> `userPreferences/{uid}` in Firestore, nothing in the browser
 *   anonymous  -> the `lm_prefs` cookie
 *
 * That split is deliberate. A signed-in user's preferences follow them between
 * devices and leave no local trace, which is a stronger guarantee than the
 * in-memory-only behaviour it replaces. The cookie is the anonymous-only
 * exception and holds display choices, never an identifier — see
 * `specs/preferences-persistence.md`.
 *
 * `localStorage` and `sessionStorage` remain forbidden for everyone;
 * `src/test/noBrowserStorage.test.ts` still enforces that.
 */

export interface StoredPreferences {
  theme?: "light" | "dark";
  language?: "es" | "en";
  currency?: string;
  originCountry?: string;
  destinationCountry?: string;
}

export const PREFERENCE_KEYS = [
  "theme",
  "language",
  "currency",
  "originCountry",
  "destinationCountry",
] as const;

const COOKIE_NAME = "lm_prefs";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const WRITE_DEBOUNCE_MS = 400;

/** Keeps a stale value out rather than rejecting the whole payload. */
function sanitize(raw: unknown): StoredPreferences {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const out: StoredPreferences = {};

  if (input.theme === "light" || input.theme === "dark") out.theme = input.theme;
  if (input.language === "es" || input.language === "en") out.language = input.language;
  if (typeof input.currency === "string" && input.currency.length <= 8) {
    out.currency = input.currency;
  }
  for (const key of ["originCountry", "destinationCountry"] as const) {
    const value = input[key];
    if (typeof value === "string" && value.length <= 60) out[key] = value;
  }
  return out;
}

// --- cookie backend ---------------------------------------------------------

function readCookie(): StoredPreferences {
  if (typeof document === "undefined") return {};
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return {};
  try {
    return sanitize(JSON.parse(decodeURIComponent(match.slice(COOKIE_NAME.length + 1))));
  } catch {
    // A corrupt cookie must not stop the app booting. Drop it and start clean.
    deleteCookie();
    return {};
  }
}

function writeCookie(prefs: StoredPreferences) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(prefs));
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function deleteCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// --- store ------------------------------------------------------------------

let userId: string | null = null;
let snapshot: StoredPreferences = {};
let writeTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(prefs: StoredPreferences) => void>();

function emit() {
  for (const listener of listeners) listener(snapshot);
}

function flush() {
  const prefs = snapshot;
  if (userId) {
    void saveStoredPreferences(userId, prefs);
  } else {
    writeCookie(prefs);
  }
}

/** Subscribe to preference changes. Returns an unsubscribe function. */
export function subscribeToPreferences(listener: (prefs: StoredPreferences) => void) {
  listeners.add(listener);
  // Returns void, not the Set's boolean: React rejects a cleanup that returns
  // anything, and `useEffect(() => subscribe(...))` is the whole point.
  return () => {
    listeners.delete(listener);
  };
}

/** The values known right now, without touching either backend. */
export function getPreferences(): StoredPreferences {
  return snapshot;
}

/** Load the anonymous cookie. Call once, before the first render. */
export function initPreferences(): StoredPreferences {
  snapshot = readCookie();
  return snapshot;
}

/**
 * Record one preference. Writes are debounced: changing a country updates
 * several values in the same tick.
 */
export function setPreference<K extends keyof StoredPreferences>(
  key: K,
  value: StoredPreferences[K]
) {
  if (snapshot[key] === value) return;
  snapshot = { ...snapshot, [key]: value };
  emit();
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flush, WRITE_DEBOUNCE_MS);
}

/**
 * Point the store at a signed-in user, migrating anything the cookie holds.
 *
 * The cookie wins per key, because those are the choices the visitor made most
 * recently — before signing in, in this session. Merging beats discarding
 * either side.
 */
export async function attachUser(uid: string): Promise<StoredPreferences> {
  userId = uid;
  const local = readCookie();
  const remote = sanitize(await getStoredPreferences(uid));
  const merged = { ...remote, ...local };

  snapshot = merged;
  emit();

  if (Object.keys(local).length > 0) {
    await saveStoredPreferences(uid, merged);
    // The browser must hold nothing once the account does.
    deleteCookie();
  }
  return merged;
}

/**
 * Forget the signed-in user. Writes nothing: one person's preferences must
 * never become the next visitor's on a shared device.
 *
 * A no-op when nobody was attached. The auth subscription fires with `null` on
 * every cold start, so without this guard an anonymous visitor's cookie values
 * were wiped a beat after the first render — the preferences persisted
 * correctly and then vanished.
 */
export function detachUser() {
  if (userId === null) return;

  userId = null;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  snapshot = {};
  emit();
}

/** Erase everything the app remembers, in both backends. */
export async function clearPreferences() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  deleteCookie();
  if (userId) await clearStoredPreferences(userId);
  snapshot = {};
  emit();
}
