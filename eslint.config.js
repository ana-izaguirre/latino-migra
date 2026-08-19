import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

/**
 * The project previously had no linter — `npm run lint` only ran `tsc`.
 *
 * Rules that catch real defects are errors. Rules that would flag hundreds of
 * pre-existing lines are warnings, so the gate is meaningful from day one and
 * the backlog can be worked down without blocking every merge.
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      // Plain browser script loaded directly by index.html, outside the build.
      "public/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        Notification: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLButtonElement: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        Event: "readonly",
        Node: "readonly",
        URL: "readonly",
        AbortController: "readonly",
        ScrollBehavior: "readonly",
        process: "readonly",
        globalThis: "readonly",
      },
    },
    rules: {
      // Correctness — these catch bugs, so they block.
      "react-hooks/rules-of-hooks": "error",
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      // Native alerts are jarring for this audience; replacing them needs a
      // toast component, so this warns until that lands.
      "no-alert": "warn",
      "@typescript-eslint/no-unused-expressions": "off",

      // Accessibility — the app targets users with low digital literacy.
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/role-has-required-aria-props": "error",

      // Errors: the backlog is paid off, so this now blocks rather than warns.
      // Dead imports and dead state accumulated to 91 occurrences before anyone
      // noticed, and clearing them surfaced a real defect — a category argument
      // that was accepted and never applied.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Known backlog — warn until the debt is paid down. `npm run lint` caps
      // the total, so the count can only go down.
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  {
    // Tests and tooling may log freely and use loose types.
    files: ["**/*.test.{ts,tsx}", "tests/**/*.ts", "scripts/**/*.mjs", "src/test/**"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly" },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Must stay last: turns off everything that would fight Prettier.
  prettier
);
