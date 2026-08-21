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
    // Point every cover at a URL that cannot resolve, which is what a dead
    // remote host looks like to the browser.
    await page.route("**/*.{png,jpg,jpeg,webp,avif}", (route) => route.abort());
    await page.reload();
    await page.locator("#bottom-nav-becas").click();

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

/**
 * The scholarship detail panel.
 *
 * It arrived as one wall of text with three equally loud buttons — one
 * offering an assistant that cannot yet answer about a specific call, and one
 * saying "Agendar", which reads as booking an appointment with somebody.
 */
test.describe("Scholarship detail on a phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#bottom-nav-becas").click();
    await page
      .getByRole("button", { name: /Ver Detalles/ })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("collapses requisitos and beneficios, and opens them on tap", async ({ page }) => {
    for (const id of ["beca-requisitos", "beca-beneficios"]) {
      const control = page.locator(`#${id}`);
      await expect(control, id).toBeVisible();
      await expect(control).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(`#${id}-panel`)).toBeHidden();
    }

    await page.locator("#beca-requisitos").click();
    await expect(page.locator("#beca-requisitos-panel")).toBeVisible();
    // Opening one leaves the other alone: they are separate disclosures, not
    // an accordion where reading one hides the other.
    await expect(page.locator("#beca-beneficios-panel")).toBeHidden();
  });

  test("keeps the bulk of the panel out of the way until it is asked for", async ({ page }) => {
    // Measure the collapsible content itself rather than the dialog: the
    // dialog is height-capped, so its own box and scrollHeight are the same
    // whether the sections are open or shut.
    const collapsibleHeight = () =>
      page.evaluate(() =>
        ["beca-requisitos-panel", "beca-beneficios-panel"].reduce(
          (total, id) =>
            total + Math.round(document.getElementById(id)?.getBoundingClientRect().height ?? 0),
          0
        )
      );

    // Collapsed means `display: none`, so it occupies nothing at all.
    expect(await collapsibleHeight()).toBe(0);

    for (const id of ["beca-requisitos", "beca-beneficios"]) {
      await page.locator(`#${id}`).click();
      await expect(page.locator(`#${id}`)).toHaveAttribute("aria-expanded", "true");
    }

    expect(await collapsibleHeight()).toBeGreaterThan(0);
  });

  test("offers the official call once, safely", async ({ page }) => {
    const link = page.locator("#beca-official-link");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /^https?:\/\//);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/convocatoria oficial/i)).toHaveCount(1);
  });

  test("says the calendar action sets a reminder", async ({ page }) => {
    const link = page.locator("#beca-calendar-reminder");
    await expect(link).toContainText(/Recordarme la fecha límite/i);
    await expect(link).not.toContainText(/Agendar/i);
  });

  test("does not offer the assistant", async ({ page }) => {
    await expect(page.locator("#beca-ask-ai")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Consultar IA/i })).toHaveCount(0);
  });

  test("keeps every action inside the viewport and thumb-sized", async ({ page }) => {
    const width = page.viewportSize()!.width;

    for (const id of ["beca-official-link", "beca-calendar-reminder"]) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box, id).not.toBeNull();
      expect(box!.height, id).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width, id).toBeLessThanOrEqual(width);
    }
  });
});
