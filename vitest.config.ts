import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // json-summary feeds scripts/coverage-summary.mjs, which renders the
      // totals into the CI job summary.
      reporter: ["text", "json", "json-summary", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "scripts/**",
        "tests/**",
        "src/test/**",
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js,mjs}",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      /**
       * Thresholds are a ratchet, not an aspiration: they sit just below the
       * current numbers so coverage can never regress, and get raised as tests
       * land. A single global target would either be unreachable today or
       * meaningless tomorrow.
       *
       * `src/lib` holds the pure logic — currency conversion, sanitisation,
       * country mapping — where high coverage is both achievable and valuable,
       * so it carries its own stricter budget.
       */
      thresholds: {
        statements: 43,
        branches: 43,
        functions: 36,
        lines: 43,
        "src/lib/PreferencesContext.tsx": {
          statements: 95,
          branches: 85,
          lines: 95,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
