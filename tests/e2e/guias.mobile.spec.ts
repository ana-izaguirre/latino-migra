import { test, expect } from "@playwright/test";

/**
 * The migration guides on a phone.
 *
 * Measured before this suite existed: the guide ran to 9857px inside a 375px
 * viewport — twelve screens of scrolling to reach the anti-scam section at the
 * bottom. Three blocks now collapse below `lg`, and the collapse is done in
 * CSS so the same content stays open on a desktop.
 *
 * These are end-to-end tests because that is a breakpoint decision: only a
 * real layout engine resolves which of `lg:hidden` and a display utility wins,
 * and it picked the wrong one on the first attempt.
 */

const GUIDE_DISCLOSURES = ["checklist-details", "antiscam-details"];

test.describe("Migration guides on a phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#bottom-nav-guia").click();
    await expect(page.locator("#roadmap-step-1")).toBeVisible();
  });

  test("collapses the heavy sections", async ({ page }) => {
    for (const id of GUIDE_DISCLOSURES) {
      const control = page.locator(`#${id}`);
      await expect(control, id).toBeVisible();
      await expect(control).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(`#${id}-panel`)).toBeHidden();
    }
  });

  test("opens a section on tap and closes it again", async ({ page }) => {
    const control = page.locator("#checklist-details");
    const panel = page.locator("#checklist-details-panel");

    await control.click();
    await expect(control).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();

    await control.click();
    await expect(control).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
  });

  test("is materially shorter than the same guide fully expanded", async ({ page }) => {
    const collapsed = await page.evaluate(() => document.documentElement.scrollHeight);

    for (const id of GUIDE_DISCLOSURES) {
      await page.locator(`#${id}`).click();
    }
    for (const control of await page.locator('button[id^="visa-details-"]').all()) {
      await control.click();
    }

    const expanded = await page.evaluate(() => document.documentElement.scrollHeight);

    // A collapse that saves nothing is decoration. The guide was twelve
    // screens tall; it has to be meaningfully less than the open version.
    expect(collapsed).toBeLessThan(expanded * 0.8);
  });

  test("reaches every control by keyboard and reports its state", async ({ page }) => {
    const control = page.locator("#checklist-details");
    await control.focus();
    await expect(control).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(control).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#checklist-details-panel")).toBeVisible();
  });

  test("gives every visa a visible link to its official source", async ({ page }) => {
    const links = page.locator('a[id^="visa-official-source-"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", /^https?:\/\//);
      await expect(link).toHaveAttribute("target", "_blank");
      // `noopener` matters: without it the opened page can reach back
      // through `window.opener`.
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
  });

  test("marks no phase of the route as the one you are on", async ({ page }) => {
    // Regression: `activeRoadmapStep` started at 2, so phase two was flagged
    // as current for every visitor, and tapping moved a marker that meant
    // nothing.
    const classNames = await page.evaluate(() =>
      [1, 2, 3, 4].map((n) => document.getElementById(`roadmap-step-${n}`)?.className ?? null)
    );

    expect(classNames.every((c) => c !== null)).toBe(true);
    expect(new Set(classNames).size).toBe(1);
    await expect(page.locator("#roadmap-step-1").locator("xpath=ancestor::ol")).toHaveCount(1);
  });
});

test.describe("Migration guides on a wide screen", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("shows the content with no collapse control at all", async ({ page }) => {
    await page.goto("/");
    await page.locator("#nav-item-guia").click();
    await expect(page.locator("#roadmap-step-1")).toBeVisible();

    for (const id of GUIDE_DISCLOSURES) {
      await expect(page.locator(`#${id}`), id).toBeHidden();
      await expect(page.locator(`#${id}-panel`), `${id}-panel`).toBeVisible();
    }

    // The visa cards too: nothing on a desktop should be behind a control.
    await expect(page.locator('button[id^="visa-details-"]:visible')).toHaveCount(0);
    await expect(page.locator("#checklist-details-panel")).toContainText(/Pasaporte/i);
  });
});
