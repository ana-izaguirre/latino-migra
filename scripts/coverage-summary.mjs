#!/usr/bin/env node
/**
 * Prints the coverage totals as a Markdown table for the GitHub job summary.
 *
 * Reads coverage/coverage-summary.json, produced by the `json-summary`
 * reporter configured in vitest.config.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUMMARY_PATH = resolve(process.cwd(), "coverage/coverage-summary.json");
const METRICS = ["statements", "branches", "functions", "lines"];

/** Coverage below this reads as a warning rather than a pass. */
const WARN_BELOW_PCT = 60;

function main() {
  let total;
  try {
    total = JSON.parse(readFileSync(SUMMARY_PATH, "utf8")).total;
  } catch (error) {
    console.log("### Test coverage\n");
    console.log(`Could not read \`coverage/coverage-summary.json\`: ${error.message}`);
    return;
  }

  const rows = METRICS.map((metric) => {
    const { pct, covered, total: count } = total[metric];
    const mark = pct >= WARN_BELOW_PCT ? "✅" : "⚠️";
    return `| ${metric} | ${mark} ${pct}% | ${covered}/${count} |`;
  });

  console.log("### Test coverage\n");
  console.log("| Metric | % | Covered |");
  console.log("|---|---|---|");
  console.log(rows.join("\n"));
}

main();
