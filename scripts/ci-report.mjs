#!/usr/bin/env node
/**
 * Runs one check and reports it where a reviewer will actually see it.
 *
 * `npm run lint` chains `eslint && tsc`, so a lint error stops the typecheck
 * from running at all and its output never reaches the log. Both also print
 * plain text, which means every finding is buried in a collapsed step rather
 * than annotated on the diff.
 *
 * This runs one of them, emits GitHub workflow annotations so findings appear
 * inline on the pull request, writes a table to the job summary, and exits
 * non-zero when the check fails.
 *
 *   node scripts/ci-report.mjs eslint
 *   node scripts/ci-report.mjs tsc
 *
 * No new dependency: annotations are the `::error file=…::message` protocol
 * that Actions already understands.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { relative } from "node:path";

/** Matches `npm run lint`. Lower it as the backlog is cleared. */
const MAX_WARNINGS = 35;

const escape = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

function annotate(level, { file, line, col, message, title }) {
  const where = [
    file ? `file=${file}` : null,
    line ? `line=${line}` : null,
    col ? `col=${col}` : null,
    title ? `title=${escape(title)}` : null,
  ]
    .filter(Boolean)
    .join(",");
  console.log(`::${level} ${where}::${escape(message)}`);
}

function summary(lines) {
  const out = lines.join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out);
  else console.log(out);
}

function run(cmd, args) {
  try {
    return { code: 0, out: execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe" }) };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function eslintReport() {
  const { out } = run("npx", ["eslint", ".", "--format", "json"]);
  const start = out.indexOf("[");
  let results = [];
  try {
    results = JSON.parse(out.slice(start));
  } catch {
    console.error("Could not parse the ESLint report:\n" + out.slice(0, 2000));
    return 1;
  }

  let errors = 0;
  let warnings = 0;
  const byRule = new Map();

  for (const file of results) {
    for (const m of file.messages) {
      const level = m.severity === 2 ? "error" : "warning";
      if (m.severity === 2) errors++;
      else warnings++;
      byRule.set(m.ruleId ?? "(parse)", (byRule.get(m.ruleId ?? "(parse)") ?? 0) + 1);
      annotate(level, {
        file: relative(process.cwd(), file.filePath),
        line: m.line,
        col: m.column,
        title: m.ruleId ?? "ESLint",
        message: m.message,
      });
    }
  }

  const overBudget = warnings > MAX_WARNINGS;
  const rows = [...byRule.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([rule, count]) => `| \`${rule}\` | ${count} |`);

  summary([
    "### ESLint",
    "",
    `| | |`,
    `|---|---|`,
    `| Errors | ${errors === 0 ? "✅ 0" : `❌ ${errors}`} |`,
    `| Warnings | ${overBudget ? "❌" : "⚠️"} ${warnings} of ${MAX_WARNINGS} allowed |`,
    "",
    ...(rows.length ? ["| Rule | Count |", "|---|---|", ...rows] : ["No findings."]),
  ]);

  if (errors > 0) console.log(`::error::ESLint found ${errors} error(s)`);
  if (overBudget) {
    console.log(
      `::error::ESLint warnings rose to ${warnings}, above the budget of ${MAX_WARNINGS}. ` +
        `The budget is a ratchet: clear warnings and lower it, never raise it.`
    );
  }
  return errors > 0 || overBudget ? 1 : 0;
}

function tscReport() {
  const { out } = run("npx", ["tsc", "--noEmit", "--pretty", "false"]);
  const findings = [];

  for (const line of out.split("\n")) {
    // file.ts(12,34): error TS2322: message
    const m = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.*)$/);
    if (m)
      findings.push({
        file: m[1],
        line: +m[2],
        col: +m[3],
        level: m[4],
        code: m[5],
        message: m[6],
      });
  }

  for (const f of findings) {
    annotate(f.level === "warning" ? "warning" : "error", {
      file: f.file,
      line: f.line,
      col: f.col,
      title: f.code,
      message: f.message,
    });
  }

  const errors = findings.filter((f) => f.level === "error").length;
  const warnings = findings.length - errors;

  summary([
    "### TypeScript",
    "",
    "| | |",
    "|---|---|",
    `| Errors | ${errors === 0 ? "✅ 0" : `❌ ${errors}`} |`,
    `| Warnings | ${warnings === 0 ? "✅ 0" : `⚠️ ${warnings}`} |`,
    "",
    findings.length === 0 ? "`tsc --noEmit` is clean." : "",
  ]);

  // Unparsed output still means a failure -- a crashed compiler must not pass.
  if (findings.length === 0 && out.trim() !== "") {
    console.log(`::error::tsc failed without reporting a diagnostic:\n${out.slice(0, 500)}`);
    return 1;
  }
  return errors > 0 ? 1 : 0;
}

const which = process.argv[2];
const exit = which === "eslint" ? eslintReport() : which === "tsc" ? tscReport() : null;
if (exit === null) {
  console.error("usage: ci-report.mjs <eslint|tsc>");
  process.exit(2);
}
process.exit(exit);
