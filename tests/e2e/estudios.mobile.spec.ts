import { test, expect } from "@playwright/test";

/**
 * The Estudios half of Becas & Estudios on a phone (#56).
 *
 * The screen carried only scholarships; the studies section is what the other
 * half of its name now points at. On a phone it has to behave like the rest of
 * the product does since #53 and #54: cards, and the long half of each card
 * behind a disclosure that exists only below `lg`.
 */
test.describe("Studies section on a phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#bottom-nav-becas").click();
    await expect(page.locator("#btn-open-mobile-filters")).toBeVisible();
    await page.locator("#tab-estudios").click();
    await expect(page.locator("#estudios-list")).toBeVisible();
  });

  test("shows programmes, each linking to an official source", async ({ page }) => {
    const cards = page.locator('[id^="estudio-card-"]');
    expect(await cards.count()).toBeGreaterThan(0);

    const links = page.locator('[id^="estudio-official-link-"]');
    expect(await links.count()).toBe(await cards.count());

    for (const href of await links.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href") ?? "")
    )) {
      expect(href, href).toMatch(/^https:\/\//);
    }
  });

  test("hides the scholarship chrome, which filters nothing here", async ({ page }) => {
    await expect(page.locator("#btn-open-mobile-filters")).toHaveCount(0);
    await expect(page.locator("#becas-search-input")).toHaveCount(0);
    await expect(page.locator("#becas-sort-select")).toHaveCount(0);
  });

  test("collapses the details of each card and opens them on tap", async ({ page }) => {
    const control = page.locator('[id^="estudio-details-"]').first();
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute("aria-expanded", "false");

    const panelId = await control.evaluate((el) => el.getAttribute("aria-controls") ?? "");
    expect(panelId).not.toBe("");
    await expect(page.locator(`#${panelId}`)).toBeHidden();

    // The control has to be a real tap target on a phone, not a 20px link.
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await control.click();
    await expect(control).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(`#${panelId}`)).toBeVisible();
  });

  test("narrows by migration route, and the chip count matches the list", async ({ page }) => {
    const chip = page.locator("#estudios-route-chip-directa");
    await expect(chip).toBeVisible();

    // The chip carries its own count; the list has to agree with it.
    const promised = Number((await chip.innerText()).match(/(\d+)\s*$/)?.[1]);
    expect(promised).toBeGreaterThan(0);

    await chip.click();

    // Everything on screen is a route-opening programme, and the "showing N of
    // M" line reports the same M the chip promised.
    await expect(page.locator("#estudios-list")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`de\\s*${promised}\\s*programas oficiales`))
    ).toBeVisible();

    const badges = await page
      .locator('[id^="estudio-card-"]')
      .locator("text=Vía migratoria")
      .count();
    expect(badges).toBeGreaterThan(0);
  });

  test("searches by name and says which filters emptied the list", async ({ page }) => {
    await page.locator("#estudios-search-input").fill("no existe este programa");

    await expect(page.getByText(/Ningún programa con estos filtros/)).toBeVisible();
    await expect(page.getByText(/"no existe este programa"/)).toBeVisible();

    await page.locator("#estudios-clear-filters").click();
    await expect(page.locator("#estudios-list")).toBeVisible();
  });

  test("fits a 375px viewport without sideways scrolling", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("Studies section on a desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("leaves the details open and hides the disclosure control", async ({ page }) => {
    await page.goto("/");
    await page.locator("#nav-item-becas").click();
    await page.locator("#tab-estudios").click();
    await expect(page.locator("#estudios-list")).toBeVisible();

    const control = page.locator('[id^="estudio-details-"]').first();
    await expect(control).toBeHidden();

    const panelId = await control.evaluate((el) => el.getAttribute("aria-controls") ?? "");
    await expect(page.locator(`#${panelId}`)).toBeVisible();
  });
});
