import { test, expect } from "@playwright/test";

/**
 * Mis Guardados on a phone (#106).
 *
 * The tab holds both catalogues since #82, and until now one filter panel sat
 * above both lists. It narrowed the scholarships; the programmes ignored it,
 * and the chip counts were measured against the whole catalogue rather than
 * against what the reader had saved. Two sub-tabs now, each with the filters
 * that describe its own kind.
 */
test.describe("Saved items on a phone", () => {
  /**
   * Saves one programme and one scholarship, then opens Mis Guardados.
   *
   * Each save is confirmed before the next step. Without that the helper only
   * asserts that a click was dispatched, not that anything was saved — and a
   * click landing before the list finished rendering left every assertion
   * below running against an empty favourites tab, which is how this failed
   * once in a full run while passing on its own.
   */
  const saveOneOfEach = async (page: import("@playwright/test").Page) => {
    await page.goto("/");
    await page.locator("#bottom-nav-becas").click();
    await expect(page.locator("#btn-open-mobile-filters")).toBeVisible();

    await page.locator("#tab-estudios").click();
    const programmeHeart = page.locator('[id^="estudio-fav-"]').first();
    await expect(programmeHeart).toHaveAttribute("aria-pressed", "false");
    await programmeHeart.click();
    await expect(programmeHeart).toHaveAttribute("aria-pressed", "true");

    await page.locator("#tab-all-scholarships").click();
    await page.locator('button[title*="favoritos"], button[title*="beca"]').first().click();

    // The counter on the tab is the app's own record of what was saved.
    const savedTab = page.getByRole("tab", { name: /Mis Guardados/ });
    await expect(savedTab).toContainText("2");

    await savedTab.click();
    await expect(page.locator("#saved-kind-tabs")).toBeVisible();
  };

  test("splits the two kinds into sub-tabs, each with its own count", async ({ page }) => {
    await saveOneOfEach(page);

    await expect(page.locator("#saved-kind-scholarships")).toContainText("(1)");
    await expect(page.locator("#saved-kind-programmes")).toContainText("(1)");

    // Both are real tap targets, unlike the shared small button (#110).
    for (const id of ["saved-kind-scholarships", "saved-kind-programmes"]) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box!.height, id).toBeGreaterThanOrEqual(44);
    }
  });

  test("shows one kind at a time, never both under one filter panel", async ({ page }) => {
    await saveOneOfEach(page);

    // The scholarship half opens first.
    await expect(page.locator('[id^="estudio-card-"]')).toHaveCount(0);

    await page.locator("#saved-kind-programmes").click();
    await expect(page.locator('[id^="estudio-card-"]')).toHaveCount(1);
    await expect(page.locator('[id^="scholarship-card-"]')).toHaveCount(0);
  });

  test("gives each kind the filters that describe it", async ({ page }) => {
    await saveOneOfEach(page);
    await page.locator("#btn-open-mobile-filters").click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.locator("#sheet-country-Todos")).toBeVisible();
    await expect(sheet.locator("#sheet-estudios-route-chip-directa")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.locator("#saved-kind-programmes").click();
    await page.locator("#btn-open-mobile-filters").click();

    // A saved scholarship has no migration route and a saved programme has no
    // education level, so the panel swaps rather than spanning both.
    await expect(sheet.locator("#sheet-estudios-route-chip-directa")).toBeVisible();
    await expect(sheet.locator("#sheet-country-Todos")).toHaveCount(0);
  });

  test("counts the chips against what is saved, not the whole catalogue", async ({ page }) => {
    await saveOneOfEach(page);
    await page.locator("#saved-kind-programmes").click();
    await page.locator("#btn-open-mobile-filters").click();

    const chip = page.getByRole("dialog").locator("#sheet-estudios-country-chip-Todos");
    await expect(chip).toBeVisible();

    // One programme is saved. Counting the catalogue would give thirteen.
    const promised = Number((await chip.innerText()).match(/(\d+)\s*$/)?.[1]);
    expect(promised).toBe(1);
  });

  test("says nothing is saved rather than blaming the catalogue", async ({ page }) => {
    await page.goto("/");
    await page.locator("#bottom-nav-becas").click();
    await expect(page.locator("#btn-open-mobile-filters")).toBeVisible();
    await page.getByRole("tab", { name: /Mis Guardados/ }).click();
    await page.locator("#saved-kind-programmes").click();

    await expect(page.locator("#empty-saved-programmes")).toBeVisible();
    await expect(page.getByText(/No pudimos mostrar el catálogo de estudios/)).toHaveCount(0);
  });

  test("fits a 375px viewport without sideways scrolling", async ({ page }) => {
    await saveOneOfEach(page);
    await page.locator("#saved-kind-programmes").click();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
