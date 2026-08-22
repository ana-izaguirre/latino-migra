import { test, expect } from "@playwright/test";

/**
 * The Estudios half of Becas & Estudios on a phone (#56, #105).
 *
 * The two halves of one screen used to look like two products: scholarships
 * filtered from a sticky sidebar and a bottom sheet, studies from a full-width
 * block above their own results, with the long half of each card inline behind
 * a disclosure. Both halves now use the same sidebar, the same sheet, the same
 * detail modal and the same pagination — only the catalogue differs.
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

  test("keeps the filter controls the scholarships use", async ({ page }) => {
    // The sidebar is `hidden lg:block`, so on a phone this trigger is the only
    // way to the filters. It used to render for scholarships only, which left
    // the studies tab with none at all.
    await expect(page.locator("#btn-open-mobile-filters")).toBeVisible();
    await expect(page.locator("#becas-search-input")).toBeVisible();

    // The sort control belongs to the scholarship list and orders nothing here.
    await expect(page.locator("#becas-sort-select")).toHaveCount(0);
  });

  test("opens the study filters in the same bottom sheet", async ({ page }) => {
    await page.locator("#btn-open-mobile-filters").click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.locator("#sheet-estudios-route-chip-directa")).toBeVisible();

    // The sheet has to sit inside the viewport. A filling animation on an
    // ancestor once made it the containing block for this `position: fixed`
    // panel and laid it out thousands of pixels down the page (#49).
    const box = await sheet.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  });

  test("opens each card's details in the shared modal", async ({ page }) => {
    const control = page.locator('[id^="estudio-details-"]').first();
    await expect(control).toBeVisible();

    /*
      The same control the scholarship card uses, at the same size. Both are
      36px rather than the 44px tap target the rest of the product keeps —
      that comes from the shared `size="sm"` button and is tracked separately,
      so this pins the parity and not the shortfall.
    */
    const studyBox = (await control.boundingBox())!;
    await page.locator("#tab-all-scholarships").click();
    const becaBox = (await page
      .getByRole("button", { name: /Ver Detalles/ })
      .first()
      .boundingBox())!;
    expect(studyBox.height).toBe(becaBox.height);

    await page.locator("#tab-estudios").click();
    await control.click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Requisitos")).toBeVisible();
    await expect(modal.locator('[id^="estudio-modal-official-link-"]')).toBeVisible();
  });

  test("narrows by migration route, and the chip count matches the list", async ({ page }) => {
    await page.locator("#btn-open-mobile-filters").click();
    const chip = page.getByRole("dialog").locator("#sheet-estudios-route-chip-directa");
    await expect(chip).toBeVisible();

    // The chip carries its own count; the list has to agree with it.
    const promised = Number((await chip.innerText()).match(/(\d+)\s*$/)?.[1]);
    expect(promised).toBeGreaterThan(0);

    await chip.click();
    await page.keyboard.press("Escape");

    // The "showing N of M" line reports the same M the chip promised.
    await expect(page.locator("#estudios-list")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`de\\s*${promised}\\s*programas oficiales`))
    ).toBeVisible();
  });

  test("searches by name and says which filters emptied the list", async ({ page }) => {
    await page.locator("#becas-search-input").fill("no existe este programa");

    await expect(page.getByText(/Ningún programa con estos filtros/)).toBeVisible();
    await expect(page.getByText(/"no existe este programa"/)).toBeVisible();
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

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#nav-item-becas").click();
    await page.locator("#tab-estudios").click();
    await expect(page.locator("#estudios-list")).toBeVisible();
  });

  test("puts the study filters in the same sidebar the scholarships use", async ({ page }) => {
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("#sidebar-estudios-route-chip-directa")).toBeVisible();

    // The list keeps the width it has on the scholarship tab: the sidebar used
    // to be dropped here, and the column stretched across the whole grid.
    const sidebarBox = (await sidebar.boundingBox())!;
    const listBox = (await page.locator("#estudios-list").boundingBox())!;
    expect(listBox.x).toBeGreaterThan(sidebarBox.x + sidebarBox.width - 1);
  });

  test("pages the catalogue in the same batches, with one way through it", async ({ page }) => {
    const cards = page.locator('[id^="estudio-card-"]');
    const first = await cards.count();
    expect(first).toBe(6);

    await page.locator("#btn-load-more-estudios").click();
    expect(await cards.count()).toBeGreaterThan(first);
  });
});
