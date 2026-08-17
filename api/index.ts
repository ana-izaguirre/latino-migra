/**
 * Vercel serverless entry point for the API.
 *
 * Vercel's Vite preset only deploys the static build, so `server.ts` never ran
 * in production and every call to /api/chat returned the SPA's index.html
 * instead of a model response. Vercel turns each file under `api/` into a
 * function, and an Express app is a valid request handler, so re-exporting the
 * same app keeps a single definition of the routes for local dev, tests and
 * production.
 */
export { default } from "../server";
