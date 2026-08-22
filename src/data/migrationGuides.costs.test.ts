import { describe, it, expect } from "vitest";
import { MIGRATION_GUIDES_DATA } from "./migrationGuides";
import { CostCategory } from "../types";

/**
 * Regression for #51.
 *
 * A cost row carried a free-form Spanish string — "Alojamiento (Habitación/
 * Basement/Apto)" — which was both the label and the only identifier. It
 * could not be translated without losing the country-specific detail inside
 * the parentheses, so the guide showed "Estimated Cost of Living" above rows
 * named in Spanish.
 */
describe("cost rows", () => {
  const rows = Object.values(MIGRATION_GUIDES_DATA).flatMap((guide) => guide.costs ?? []);
  const known: CostCategory[] = ["housing", "food", "transport", "health", "phone", "other"];

  it("has rows to assert against", () => {
    expect(rows.length).toBeGreaterThan(20);
  });

  it("names every expense with a key the interface can translate", () => {
    for (const row of rows) {
      expect(known, JSON.stringify(row.categoryDetail)).toContain(row.categoryKey);
    }
  });

  it("carries no Spanish label of its own", () => {
    // The old `category` field was the label. If it comes back, so does the
    // untranslatable row.
    for (const row of rows) {
      expect(row).not.toHaveProperty("category");
    }
  });

  it("keeps the local detail, and only where it names something local", () => {
    // "Deutschlandticket", "Leap Card", "OSHC", "GKV" — schemes and cards a
    // reader will meet by that name, which is why a key alone is not enough.
    // Everything else was the rest of a Spanish label, and the key already
    // says what the expense is.
    const details = rows.map((row) => row.categoryDetail).filter(Boolean) as string[];
    expect(details.length).toBeGreaterThan(4);

    // No detail may be a plain Spanish description; those are what the key
    // replaces.
    for (const detail of details) {
      expect(detail, detail).not.toMatch(/Habitación|Supermercado|Obligatorio|Mensual|Servicios/);
    }
  });

  it("uses `other` only where no expense kind fits", () => {
    const other = rows.filter((row) => row.categoryKey === "other");
    // A guide whose every row is "other" would translate to nothing useful.
    expect(other.length).toBeLessThan(rows.length / 2);
  });
});
