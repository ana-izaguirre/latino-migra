// @vitest-environment node
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { buildLimiter } from "../../server";

/**
 * Regression tests for GitHub issue #1 (code scanning alert
 * "Missing rate limiting", CodeQL js/missing-rate-limiting).
 *
 * The alert fired because request handlers reaching the file system and the
 * CRON_SECRET authorization check were not guarded by a recognised rate
 * limiter. These tests pin the behaviour the fix relies on: requests past the
 * budget are rejected with 429 rather than reaching the handler.
 */
describe("Rate limiting", () => {
  const makeApp = (limit: number, message = "slow down") => {
    const app = express();
    app.set("trust proxy", 1);
    const limiter = buildLimiter(60_000, limit, message);
    let handled = 0;
    app.get("/guarded", limiter, (_req, res) => {
      handled += 1;
      res.json({ ok: true, handled });
    });
    return app;
  };

  it("lets requests through while under the budget", async () => {
    const app = makeApp(3);

    for (let i = 0; i < 3; i += 1) {
      const res = await request(app).get("/guarded");
      expect(res.status).toBe(200);
    }
  });

  it("rejects requests past the budget with 429 instead of running the handler", async () => {
    const app = makeApp(2);

    await request(app).get("/guarded").expect(200);
    const last = await request(app).get("/guarded").expect(200);
    // The handler ran exactly twice; the third request must not increment it.
    expect(last.body.handled).toBe(2);

    const blocked = await request(app).get("/guarded");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: "slow down" });
  });

  it("advertises the remaining budget with standard RateLimit headers", async () => {
    const app = makeApp(5);

    const res = await request(app).get("/guarded");
    expect(res.status).toBe(200);
    // draft-7 emits a single combined `ratelimit` header.
    expect(res.headers["ratelimit"]).toBeDefined();
    // Legacy X-RateLimit-* headers are disabled.
    expect(res.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("counts each client address separately", async () => {
    const app = makeApp(1);

    await request(app).get("/guarded").set("X-Forwarded-For", "203.0.113.1").expect(200);
    await request(app).get("/guarded").set("X-Forwarded-For", "203.0.113.1").expect(429);

    // A different client still has its full budget.
    await request(app).get("/guarded").set("X-Forwarded-For", "203.0.113.2").expect(200);
  });
});
