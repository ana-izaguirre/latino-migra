import { test, expect } from "@playwright/test";

/**
 * The scholarship list on a phone.
 *
 * The screen used to carry two ways of paging — a numbered pager and a "load
 * more" button behind a mode switch — plus a page-size selector. Three
 * controls doing one job, and on a phone the numbered pager was a row of tap
 * targets nobody asked for. There is one way through the catalogue now.
 */
test.describe("Scholarship list on a phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#bottom-nav-becas").click();
    await expect(page.locator("#btn-open-mobile-filters")).toBeVisible();
  });

  test("has one way to see more, and no numbered pager", async ({ page }) => {
    await expect(page.locator("#btn-load-more-scholarships")).toBeVisible();

    for (const id of [
      "#pagination-first-page",
      "#pagination-prev-page",
      "#pagination-next-page",
      "#mode-paginated-btn",
      "#mode-lazy-btn",
    ]) {
      await expect(page.locator(id), id).toHaveCount(0);
    }
    await expect(page.locator('[id^="items-per-page-"]')).toHaveCount(0);
  });

  test("grows the list on request and stops at the end", async ({ page }) => {
    const cards = page.getByRole("button", { name: /Ver Detalles/ });
    const first = await cards.count();
    expect(first).toBeGreaterThan(0);

    await page.locator("#btn-load-more-scholarships").click();
    expect(await cards.count()).toBeGreaterThan(first);

    // Keep going until the button retires itself.
    for (let i = 0; i < 10; i += 1) {
      const more = page.locator("#btn-load-more-scholarships");
      if ((await more.count()) === 0) break;
      await more.click();
    }

    await expect(page.locator("#btn-load-more-scholarships")).toHaveCount(0);
    await expect(page.getByText(/Has llegado al final/i)).toBeVisible();
    await expect(page.locator("#btn-back-to-list-top")).toBeVisible();
  });

  test("keeps the load control reachable and sized for a thumb", async ({ page }) => {
    const box = await page.locator("#btn-load-more-scholarships").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    const viewport = page.viewportSize();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  });

  test("shows a placeholder rather than a broken image when a cover fails", async ({ page }) => {
    // Fail every image request, which is what a dead remote host looks like
    // to the browser.
    //
    // Matched by resource type rather than by file extension: the covers are
    // Unsplash URLs like `photo-1543783207-ec64e4d95325?auto=format&w=800`,
    // which carry no extension at all. A `**/*.{png,jpg,…}` pattern matches
    // none of them, so the route never fired and this test passed without
    // ever exercising the fallback.
    let imagesBlocked = 0;
    await page.route("**/*", (route) => {
      if (route.request().resourceType() !== "image") return route.continue();
      imagesBlocked += 1;
      return route.abort();
    });
    await page.reload();
    await page.locator("#bottom-nav-becas").click();

    // The test has to prove its own premise. The previous pattern matched no
    // request at all, so this assertion is what stops it passing for the
    // wrong reason again.
    await expect
      .poll(() => imagesBlocked, { message: "no image request was intercepted" })
      .toBeGreaterThan(0);

    const placeholder = page.getByRole("img", { name: /Imagen no disponible/ }).first();
    await expect(placeholder).toBeVisible();

    // The card keeps its shape: a placeholder that collapses is as bad as a
    // broken icon.
    const box = await placeholder.boundingBox();
    expect(box!.height).toBeGreaterThan(40);
  });

  test("puts the card actions on one row instead of stacking them as blocks", async ({ page }) => {
    const positions = await page.evaluate(() => {
      const details = [...document.querySelectorAll("button")].find((b) =>
        /Ver Detalles/.test(b.textContent || "")
      );
      const footer = details?.parentElement;
      if (!footer) return null;
      return [...footer.children].map((el) => Math.round(el.getBoundingClientRect().top));
    });

    expect(positions).not.toBeNull();
    expect(positions!.length).toBeGreaterThan(1);
    // Same top edge means one row. Stacked blocks was the complaint.
    expect(new Set(positions).size).toBe(1);
  });

  test("announces how much of the catalogue is loaded", async ({ page }) => {
    const bar = page.getByRole("progressbar");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-valuemax", /\d+/);

    const before = Number(await bar.getAttribute("aria-valuenow"));
    await page.locator("#btn-load-more-scholarships").click();
    const after = Number(await bar.getAttribute("aria-valuenow"));

    expect(after).toBeGreaterThan(before);
  });
});
