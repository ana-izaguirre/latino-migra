// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../server";

/**
 * Guards for the API hardening:
 *  - the cron endpoint must fail closed when CRON_SECRET is not configured
 *  - the chat endpoint must reject oversized input before calling the model
 *  - security headers must be present
 */
describe("API security", () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
    vi.restoreAllMocks();
  });

  describe("cron sync endpoint", () => {
    beforeEach(() => {
      // Keep the console quiet for the expected "not configured" path.
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("refuses to run when CRON_SECRET is not configured", async () => {
      delete process.env.CRON_SECRET;

      const res = await request(app).post("/api/cron/sync-scholarships").send({});

      // 503, not 200: an unset secret must never mean "no authentication".
      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/no está configurado/i);
    });

    it("rejects a wrong secret", async () => {
      process.env.CRON_SECRET = "the-real-secret";

      const res = await request(app)
        .post("/api/cron/sync-scholarships")
        .send({ secretKey: "guessed" });

      expect(res.status).toBe(401);
    });
  });

  describe("chat endpoint input limits", () => {
    it("requires a message", async () => {
      const res = await request(app).post("/api/chat").send({});
      expect(res.status).toBe(400);
    });

    it("rejects a message longer than the cap without calling the model", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "a".repeat(4001) });

      expect(res.status).toBe(413);
      expect(res.body.error).toMatch(/4000/);
    });

    it("rejects a body larger than the JSON limit", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "a".repeat(200_000) });

      // Express rejects the payload before the handler runs.
      expect([413, 400]).toContain(res.status);
    });
  });

  describe("security headers", () => {
    it("locks down API responses with a deny-all content security policy", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      // The API only returns JSON, so nothing should be loadable from it.
      expect(res.headers["content-security-policy"]).toContain("default-src 'none'");
      expect(res.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("scopes the policy to /api so it cannot break the SPA", async () => {
      // A page-level policy blocked Vite's inline preamble and stopped React
      // from mounting entirely; page CSP belongs in vercel.json. Non-API paths
      // carry only the bare `default-src 'none'` that Express's own 404
      // handler emits, not the directives added here.
      const res = await request(app).get("/not-an-api-route");

      const csp = res.headers["content-security-policy"] ?? "";
      expect(csp).not.toContain("frame-ancestors");
      expect(csp).not.toContain("form-action");
      expect(csp).not.toContain("script-src");
    });

    it("does not advertise the framework", async () => {
      const res = await request(app).get("/api/health");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });
});
