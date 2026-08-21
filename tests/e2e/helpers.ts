import { Page, expect } from "@playwright/test";

/**
 * Every screen reachable from the navigation.
 *
 * The product is narrowed to Becas, Guías and the assistant, so the planner,
 * the calculator, volunteering, the community, the feedback hub and the
 * consular map are no longer offered —
 * see `src/lib/navigation.ts`. Their components still exist; nothing links to
 * them. Restoring one means adding it back here as well.
 */
export const ALL_TABS = ["home", "becas", "guia", "chat"] as const;

export type Tab = (typeof ALL_TABS)[number];

/**
 * Navigate on a touch layout. The bottom bar covers the main destinations;
 * everything else goes through the drawer.
 */
export async function gotoTabMobile(page: Page, tab: Tab) {
  const bottomNavIds: Partial<Record<Tab, string>> = {
    home: "#bottom-nav-home",
    becas: "#bottom-nav-becas",
    guia: "#bottom-nav-guia",
    chat: "#bottom-nav-chat",
  };

  const direct = bottomNavIds[tab];
  if (direct) {
    await page.locator(direct).click();
  } else {
    await page.locator("#mobile-menu-toggle").click();
    await expect(page.locator("#mobile-nav-drawer")).toBeVisible();
    await page.locator(`#drawer-nav-item-${tab}`).click();
    await expect(page.locator("#mobile-nav-drawer")).toBeHidden();
  }
  await page.waitForTimeout(400);
}

/**
 * The document must never scroll sideways. A single overflowing element used
 * to widen the layout viewport to 543px on a 390px phone, which made the
 * browser shrink the whole page to fit.
 */
export async function expectNoHorizontalOverflow(page: Page, context: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    scrollWidth,
    `${context}: document scrolls horizontally (${scrollWidth}px of content in a ${clientWidth}px viewport)`
  ).toBeLessThanOrEqual(clientWidth + 1);
}

/** Returns controls painted smaller than the given minimum touch size. */
export async function findSmallTapTargets(page: Page, minSize = 40) {
  return page.evaluate((min) => {
    const selector =
      'button, a[href], select, input[type="checkbox"], input[type="radio"], [role="button"]';
    const offenders: string[] = [];

    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.closest('[aria-hidden="true"]')) return;
      const rect = el.getBoundingClientRect();
      // Skip anything not currently painted.
      if (rect.width === 0 || rect.height === 0) return;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") return;

      if (rect.height < min || rect.width < min) {
        const label = el.id || (el.textContent || "").trim().slice(0, 30) || el.tagName;
        offenders.push(`${label} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
      }
    });

    return offenders;
  }, minSize);
}
