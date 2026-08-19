// @vitest-environment node
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import pkg from "../../package.json";
import tsconfig from "../../tsconfig.json";

const require = createRequire(import.meta.url);

/**
 * Guards the type checker itself.
 *
 * `@types/react` was absent for the life of the project. Without it `React.FC`
 * resolves to `any` and TypeScript silently stops checking JSX props, so
 * `npm run lint` ran `tsc --noEmit` over ~12,000 lines of components and
 * verified nothing. A real defect shipped through that gap: `FloatingChatWidget`
 * declared props that `App.tsx` never passed, lint passed, and the button threw
 * a TypeError at runtime.
 *
 * Removing the dependency again would restore that silence without failing
 * anything — hence these tests.
 */
describe("TypeScript configuration", () => {
  it("declares the React type packages", () => {
    expect(pkg.devDependencies).toHaveProperty("@types/react");
    expect(pkg.devDependencies).toHaveProperty("@types/react-dom");
  });

  it("resolves the React type definitions on disk", () => {
    // Declared but not installed is the same silence as never declared.
    // Resolved through each package's manifest: the packages restrict their
    // `exports`, so the .d.ts files are not addressable directly.
    for (const name of ["@types/react", "@types/react-dom"]) {
      const manifest = require.resolve(`${name}/package.json`);
      expect(existsSync(join(dirname(manifest), "index.d.ts")), name).toBe(true);
    }
  });

  it("enables strict mode", () => {
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  /**
   * The decisive check: proving the checker is live rather than merely present.
   * Compiles a component used with a prop it does not accept and requires the
   * compiler to reject it.
   */
  it("rejects a component prop that does not exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "lm-typecheck-"));
    const file = join(dir, "probe.tsx");
    writeFileSync(
      file,
      [
        "interface Props { label: string }",
        "const Widget = (_: Props) => null;",
        "export const Broken = () => <Widget nonexistentProp={42} />;",
      ].join("\n")
    );

    let failed = false;
    let output = "";
    try {
      execFileSync(
        "npx",
        ["tsc", "--noEmit", "--strict", "--jsx", "react-jsx", "--skipLibCheck", file],
        { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" }
      );
    } catch (err: any) {
      failed = true;
      output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }

    expect(failed, "tsc accepted an unknown prop — JSX checking is off").toBe(true);
    expect(output).toMatch(/nonexistentProp/);
  }, 60_000);
});
