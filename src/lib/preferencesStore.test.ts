import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as firebase from "./firebase";
import {
  initPreferences,
  getPreferences,
  setPreference,
  attachUser,
  detachUser,
  clearPreferences,
  subscribeToPreferences,
} from "./preferencesStore";

const readCookie = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith("lm_prefs="))
    ?.slice("lm_prefs=".length);

const setCookie = (value: string) => {
  document.cookie = `lm_prefs=${encodeURIComponent(value)}; Path=/`;
};

const wipeCookie = () => {
  document.cookie = "lm_prefs=; Path=/; Max-Age=0";
};

describe("preferencesStore", () => {
  beforeEach(() => {
    wipeCookie();
    detachUser();
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    wipeCookie();
  });

  describe("anonymous visitor", () => {
    it("starts empty when no cookie is present", () => {
      expect(initPreferences()).toEqual({});
    });

    it("writes a preference to the cookie", () => {
      initPreferences();
      setPreference("language", "en");
      vi.advanceTimersByTime(500);

      expect(decodeURIComponent(readCookie()!)).toBe('{"language":"en"}');
    });

    it("debounces several changes into one write", () => {
      initPreferences();
      setPreference("language", "en");
      setPreference("theme", "dark");
      setPreference("currency", "USD");

      // Nothing written yet.
      expect(readCookie()).toBeUndefined();
      vi.advanceTimersByTime(500);

      expect(JSON.parse(decodeURIComponent(readCookie()!))).toEqual({
        language: "en",
        theme: "dark",
        currency: "USD",
      });
    });

    it("reads a stored cookie back", () => {
      setCookie('{"theme":"dark","currency":"COP"}');
      expect(initPreferences()).toEqual({ theme: "dark", currency: "COP" });
    });

    it("discards a corrupt cookie instead of throwing on boot", () => {
      setCookie("not json at all");
      expect(initPreferences()).toEqual({});
      expect(readCookie()).toBeUndefined();
    });

    it("drops an unrecognised value without discarding the rest", () => {
      setCookie('{"language":"klingon","theme":"dark"}');
      // A language the app dropped support for must not take the theme with it.
      expect(initPreferences()).toEqual({ theme: "dark" });
    });

    it("ignores a value of the wrong type", () => {
      setCookie('{"theme":42,"currency":"EUR"}');
      expect(initPreferences()).toEqual({ currency: "EUR" });
    });
  });

  describe("signed-in user", () => {
    it("writes to Firestore and not the cookie", async () => {
      const save = vi.spyOn(firebase, "saveStoredPreferences").mockResolvedValue(undefined);
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({});
      initPreferences();

      await attachUser("uid-1");
      setPreference("theme", "dark");
      vi.advanceTimersByTime(500);

      expect(save).toHaveBeenCalledWith("uid-1", { theme: "dark" });
      expect(readCookie()).toBeUndefined();
    });

    it("migrates cookie values into the account and clears the cookie", async () => {
      const save = vi.spyOn(firebase, "saveStoredPreferences").mockResolvedValue(undefined);
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({ currency: "USD" });
      setCookie('{"language":"en"}');
      initPreferences();

      const merged = await attachUser("uid-1");

      // Both sides survive: remote keeps what the cookie does not mention.
      expect(merged).toEqual({ currency: "USD", language: "en" });
      expect(save).toHaveBeenCalledWith("uid-1", { currency: "USD", language: "en" });
      expect(readCookie()).toBeUndefined();
    });

    it("lets the cookie win for a key set in both", async () => {
      vi.spyOn(firebase, "saveStoredPreferences").mockResolvedValue(undefined);
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({ language: "es" });
      setCookie('{"language":"en"}');
      initPreferences();

      // The cookie holds the choice made most recently, before signing in.
      expect(await attachUser("uid-1")).toEqual({ language: "en" });
    });

    it("does not write when there was nothing in the cookie", async () => {
      const save = vi.spyOn(firebase, "saveStoredPreferences").mockResolvedValue(undefined);
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({ theme: "dark" });
      initPreferences();

      await attachUser("uid-1");
      expect(save).not.toHaveBeenCalled();
    });

    it("falls back to defaults when Firestore is unavailable", async () => {
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({});
      initPreferences();
      expect(await attachUser("uid-1")).toEqual({});
    });
  });

  describe("signing out", () => {
    it("does not wipe an anonymous visitor's values", () => {
      setCookie('{"theme":"dark"}');
      initPreferences();

      // The auth subscription fires with null on every cold start, long after
      // the cookie has been read. That must not count as a sign-out.
      detachUser();

      expect(getPreferences()).toEqual({ theme: "dark" });
    });

    it("leaves nothing behind for the next visitor", async () => {
      vi.spyOn(firebase, "saveStoredPreferences").mockResolvedValue(undefined);
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({ theme: "dark" });
      initPreferences();
      await attachUser("uid-1");

      detachUser();
      vi.advanceTimersByTime(500);

      expect(getPreferences()).toEqual({});
      // Crucially not written to the cookie: on a shared device the next
      // person would inherit them.
      expect(readCookie()).toBeUndefined();
    });
  });

  describe("clearing", () => {
    it("empties the cookie for an anonymous visitor", async () => {
      initPreferences();
      setPreference("theme", "dark");
      vi.advanceTimersByTime(500);
      expect(readCookie()).toBeDefined();

      await clearPreferences();

      expect(getPreferences()).toEqual({});
      expect(readCookie()).toBeUndefined();
    });

    it("empties both backends for a signed-in user", async () => {
      vi.spyOn(firebase, "saveStoredPreferences").mockResolvedValue(undefined);
      vi.spyOn(firebase, "getStoredPreferences").mockResolvedValue({ theme: "dark" });
      const clear = vi.spyOn(firebase, "clearStoredPreferences").mockResolvedValue(undefined);
      initPreferences();
      await attachUser("uid-1");

      await clearPreferences();

      expect(clear).toHaveBeenCalledWith("uid-1");
      expect(getPreferences()).toEqual({});
      expect(readCookie()).toBeUndefined();
    });

    it("cancels a pending write so it cannot resurrect the values", async () => {
      initPreferences();
      setPreference("theme", "dark");

      await clearPreferences();
      vi.advanceTimersByTime(1000);

      expect(readCookie()).toBeUndefined();
    });
  });

  it("notifies subscribers", () => {
    initPreferences();
    const seen: unknown[] = [];
    const unsubscribe = subscribeToPreferences((p) => seen.push(p));

    setPreference("theme", "dark");
    unsubscribe();
    setPreference("language", "en");

    expect(seen).toEqual([{ theme: "dark" }]);
  });
});
