import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The app must not persist anything to browser storage. This walks the source
 * tree so a reintroduced `localStorage.setItem` fails the build rather than
 * quietly shipping.
 */
const SRC = join(process.cwd(), "src");

const collectSourceFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

/** Strips line and block comments so prose mentioning storage does not trip the scan. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("Browser storage", () => {
  const files = collectSourceFiles(SRC);

  it("finds source files to scan", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("is never read from or written to in application code", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const code = stripComments(readFileSync(file, "utf8"));
      const matches = code.match(/\b(localStorage|sessionStorage)\s*\.\s*\w+/g);
      if (matches) {
        offenders.push(`${relative(process.cwd(), file)}: ${[...new Set(matches)].join(", ")}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
