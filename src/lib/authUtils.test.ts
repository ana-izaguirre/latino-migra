import { describe, it, expect } from "vitest";
import { isAdmin } from "./authUtils";
import { GoogleUser } from "../types";

const user = (overrides: Partial<GoogleUser> = {}): GoogleUser => ({
  id: "usr-1",
  name: "Carlos Mendoza",
  email: "carlos@example.com",
  avatar: "https://example.com/avatar.jpg",
  countryOfOrigin: "Colombia",
  signedInAt: "13 ago 2026",
  ...overrides,
});

describe("isAdmin", () => {
  it("grants admin only when the flag resolved from the admins collection is true", () => {
    expect(isAdmin(user({ isAdmin: true }))).toBe(true);
  });

  it("denies a user with no admin entry", () => {
    expect(isAdmin(user())).toBe(false);
    expect(isAdmin(user({ isAdmin: false }))).toBe(false);
  });

  it("denies null and undefined", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  /**
   * Regression for the privilege escalation in #19.
   *
   * `isAdmin()` short-circuited on `user.role === "admin"`, and `AuthModal`
   * offered a button that called `onSignIn({ ...currentUser, role: "admin" })`.
   * Any signed-in user could therefore hand themselves the admin interface.
   *
   * The role field is gone from GoogleUser, so this asserts the shape a caller
   * could still construct at runtime — a user object carrying `role: "admin"`
   * must not be treated as an administrator.
   */
  it("ignores a role field injected onto the user object", () => {
    const escalated = { ...user(), role: "admin" } as GoogleUser;
    expect(isAdmin(escalated)).toBe(false);
  });

  it("ignores an admin email when no admin entry backs it", () => {
    // The check used to fall back to a hardcoded ADMIN_EMAILS list shipped in
    // the bundle. Authority is the admins collection now, nothing else.
    const byEmail = user({ email: "ana.izaguirre@gmail.com" });
    expect(isAdmin(byEmail)).toBe(false);
  });
});
