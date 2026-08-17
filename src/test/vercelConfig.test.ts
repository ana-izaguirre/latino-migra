// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * vercel.json is only validated at deploy time, so a mistake here is not
 * caught by the build, the linter or any other test — the deploy just fails.
 *
 * These checks cover the two ways it has actually broken:
 *  - an unsupported property (`comment`) rejected by Vercel's schema, since
 *    JSON has no comment syntax
 *  - a catch-all SPA rewrite that swallowed /_vercel/, breaking Analytics and
 *    Speed Insights with "No data available"
 */
const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

/** Properties Vercel accepts on a rewrite rule. */
const ALLOWED_REWRITE_KEYS = new Set(["source", "destination", "has", "missing", "statusCode"]);
const ALLOWED_HEADER_KEYS = new Set(["source", "headers", "has", "missing"]);

/** Builds the matcher Vercel applies for a `source` pattern. */
const matcher = (source: string) => new RegExp(`^${source}$`);

describe("vercel.json", () => {
  it("uses only properties Vercel's schema accepts", () => {
    for (const rule of config.rewrites ?? []) {
      for (const key of Object.keys(rule)) {
        expect(ALLOWED_REWRITE_KEYS, `unsupported rewrite property "${key}"`).toContain(key);
      }
    }

    for (const rule of config.headers ?? []) {
      for (const key of Object.keys(rule)) {
        expect(ALLOWED_HEADER_KEYS, `unsupported header property "${key}"`).toContain(key);
      }
    }
  });

  it("routes API calls to the serverless function", () => {
    const apiRule = config.rewrites.find((r: { destination: string }) =>
      r.destination.startsWith("/api/")
    );

    expect(apiRule, "an /api rewrite must exist or the chat endpoint 404s").toBeDefined();
    expect(matcher(apiRule.source).test("/api/chat")).toBe(true);
  });

  it("does not let the SPA fallback swallow API or Vercel internal routes", () => {
    const spaRule = config.rewrites.find(
      (r: { destination: string }) => r.destination === "/index.html"
    );
    expect(spaRule).toBeDefined();

    const re = matcher(spaRule.source);

    // These must fall through to their real handlers.
    expect(re.test("/api/chat"), "API routes must not hit the SPA fallback").toBe(false);
    expect(
      re.test("/_vercel/speed-insights/script.js"),
      "Speed Insights must not hit the SPA fallback"
    ).toBe(false);
    expect(re.test("/_vercel/insights/script.js"), "Analytics must not hit the SPA fallback").toBe(
      false
    );

    // Application routes still resolve to the SPA.
    expect(re.test("/becas")).toBe(true);
    expect(re.test("/")).toBe(true);
  });

  it("sends the baseline security headers", () => {
    const keys = (config.headers ?? []).flatMap((rule: { headers: { key: string }[] }) =>
      rule.headers.map((h) => h.key)
    );

    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("Referrer-Policy");
    expect(keys).toContain("Strict-Transport-Security");
  });
});
