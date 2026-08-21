import { describe, it, expect } from "vitest";
import { HIDDEN_TABS, isTabVisible } from "./navigation";
import { NavigationTab } from "../types";

/**
 * The product is narrowed to Becas and Guías. These screens still exist and
 * still compile; nothing links to them.
 */
describe("navigation visibility", () => {
  it("keeps the screens the product is built on", () => {
    for (const tab of ["home", "becas", "guia"] as NavigationTab[]) {
      expect(isTabVisible(tab), tab).toBe(true);
    }
  });

  it("hides the unfinished screens", () => {
    for (const tab of [
      "planificador",
      "calculadora",
      "voluntariados",
      "comunidad",
      "feedback",
    ] as NavigationTab[]) {
      expect(isTabVisible(tab), tab).toBe(false);
    }
  });

  it("hides nothing the product depends on", () => {
    // A hidden Becas or Guías would leave the application with no way in.
    expect(HIDDEN_TABS).not.toContain("becas");
    expect(HIDDEN_TABS).not.toContain("guia");
    expect(HIDDEN_TABS).not.toContain("home");
  });

  it("lists each hidden screen once", () => {
    expect(new Set(HIDDEN_TABS).size).toBe(HIDDEN_TABS.length);
  });

  it("treats an unknown tab as visible rather than swallowing it", () => {
    // Failing open is right here: a screen that exists but is missing from
    // the list should still be reachable, not silently unreachable.
    expect(isTabVisible("something-new" as NavigationTab)).toBe(true);
  });
});
