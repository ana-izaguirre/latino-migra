import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDoc } from "firebase/firestore";
import { isUserAdmin } from "./firebase";

/**
 * `isUserAdmin` is the only thing that grants administrator status now, so its
 * failure mode matters as much as its happy path: a denied or failed read must
 * mean "not an administrator", never "assume yes".
 */
describe("isUserAdmin", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is true when the admins entry exists", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => true } as never);
    await expect(isUserAdmin("uid-1")).resolves.toBe(true);
  });

  it("is false when the admins entry does not exist", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as never);
    await expect(isUserAdmin("uid-1")).resolves.toBe(false);
  });

  it("fails closed when the read is denied", async () => {
    vi.mocked(getDoc).mockRejectedValueOnce(new Error("Missing or insufficient permissions"));
    await expect(isUserAdmin("uid-1")).resolves.toBe(false);
  });

  it("reports the failure rather than swallowing it", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getDoc).mockRejectedValueOnce(new Error("network"));

    await isUserAdmin("uid-1");

    // A broken admin lookup silently downgrades an administrator to a normal
    // user, which is exactly the kind of failure this project has shipped
    // before. It must be visible.
    expect(logged).toHaveBeenCalled();
    expect(String(logged.mock.calls[0]?.[1])).toContain("admins/uid-1");
  });
});
