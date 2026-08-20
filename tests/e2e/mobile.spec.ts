import { test, expect } from "@playwright/test";
import {
  ALL_TABS,
  gotoTabMobile,
  expectNoHorizontalOverflow,
  findSmallTapTargets,
} from "./helpers";

/**
 * Mobile regression suite. The device comes from the Playwright project, so
 * these run on every phone profile configured there.
 *
 * The app used to render a 543px-wide top bar inside a 390px viewport, which
 * forced horizontal scrolling on every screen and pushed the sign-in, theme,
 * currency and language controls off the display entirely.
 */

/** Width the project's device reports, used instead of a hardcoded value. */
const viewportWidth = (page: { viewportSize: () => { width: number } | null }) =>
  page.viewportSize()?.width ?? 0;

test.describe("Mobile layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("never scrolls horizontally on any screen", async ({ page }) => {
    await expectNoHorizontalOverflow(page, "home");

    for (const tab of ALL_TABS.filter((t) => t !== "home")) {
      await gotoTabMobile(page, tab);
      await expectNoHorizontalOverflow(page, tab);
    }
  });

  test("keeps the layout viewport at the device width", async ({ page }) => {
    // If content overflows, mobile browsers shrink the page to fit and
    // innerWidth reports the wider layout instead of the device width.
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(innerWidth).toBe(viewportWidth(page));
  });

  test("shows the account, alerts and theme controls inside the viewport", async ({ page }) => {
    for (const id of ["#login-profile-btn", "#alerts-center-btn", "#mobile-menu-toggle"]) {
      const box = await page.locator(id).boundingBox();
      expect(box, `${id} should be rendered`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${id} must fit inside the viewport`).toBeLessThanOrEqual(
        viewportWidth(page)
      );
    }
  });

  test("hides the desktop navigation and shows the bottom bar", async ({ page }) => {
    await expect(page.locator("#mobile-bottom-nav")).toBeVisible();
    await expect(page.locator("#nav-item-becas")).toBeHidden();
  });
});

test.describe("Mobile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("navigates between main screens from the bottom bar in one tap", async ({ page }) => {
    await page.locator("#bottom-nav-becas").click();
    await expect(page.locator("text=Directorio Oficial de Becas")).toBeVisible();
    await expect(page.locator("#bottom-nav-becas")).toHaveAttribute("aria-current", "page");

    await page.locator("#bottom-nav-guia").click();
    await expect(page.locator("text=Guías Oficiales Paso a Paso").first()).toBeVisible();

    await page.locator("#bottom-nav-home").click();
    await expect(page.locator("h1").first()).toContainText("Tu futuro no tiene fronteras");
  });

  test("opens the drawer from the bottom bar menu button", async ({ page }) => {
    await page.locator("#bottom-nav-menu").click();
    await expect(page.locator("#mobile-nav-drawer")).toBeVisible();

    await page.locator("#drawer-nav-item-calculadora").click();
    await expect(page.locator("#mobile-nav-drawer")).toBeHidden();
    await expect(page.locator("h1").first()).toContainText("Calculadora de Costo de Vida");
  });

  test("closes the drawer with Escape", async ({ page }) => {
    await page.locator("#mobile-menu-toggle").click();
    await expect(page.locator("#mobile-nav-drawer")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav-drawer")).toBeHidden();
  });

  test("restores the reading position when the drawer is dismissed", async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" as ScrollBehavior }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const before = await page.evaluate(() => window.scrollY);

    // dispatchEvent rather than click(): the toggle lives in a sticky header,
    // and Playwright's actionability check scrolls the page to the top before
    // clicking it, which would destroy the position under test. A real tap on
    // an already-visible sticky control scrolls nothing.
    await page.locator("#mobile-menu-toggle").dispatchEvent("click");
    await expect(page.locator("#mobile-nav-drawer")).toBeVisible();
    // Dismiss without navigating.
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav-drawer")).toBeHidden();

    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(30);
  });
});

test.describe("Mobile ergonomics", () => {
  test("gives form controls a 16px font so iOS does not zoom on focus", async ({ page }) => {
    await page.goto("/");
    await page.locator("#bottom-nav-becas").click();

    const fontSize = await page
      .locator("#becas-search-input")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test("keeps navigation and account controls at a usable touch size", async ({ page }) => {
    await page.goto("/");

    const controls = [
      "#mobile-menu-toggle",
      "#login-profile-btn",
      "#alerts-center-btn",
      "#bottom-nav-home",
      "#bottom-nav-becas",
      "#bottom-nav-menu",
    ];

    for (const id of controls) {
      const box = await page.locator(id).boundingBox();
      expect(box, `${id} should be rendered`).not.toBeNull();
      expect(box!.height, `${id} height`).toBeGreaterThanOrEqual(40);
      expect(box!.width, `${id} width`).toBeGreaterThanOrEqual(40);
    }
  });

  test("has no undersized controls on the home screen", async ({ page }) => {
    await page.goto("/");
    const offenders = await findSmallTapTargets(page, 32);
    expect(offenders, `undersized controls: ${offenders.join(", ")}`).toEqual([]);
  });

  test("does not let the floating chat button fall outside the viewport", async ({ page }) => {
    await page.goto("/");
    const box = await page.locator("#floating-chat-trigger-btn").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth(page));

    // And it must be clickable rather than hidden behind page content.
    await page.locator("#floating-chat-trigger-btn").click();
    await expect(page.locator("#floating-chat-popup")).toBeVisible();
  });

  test("keeps the floating chat clear of the bottom navigation", async ({ page }) => {
    await page.goto("/");
    const chat = await page.locator("#floating-chat-trigger-btn").boundingBox();
    const nav = await page.locator("#mobile-bottom-nav").boundingBox();

    expect(chat).not.toBeNull();
    expect(nav).not.toBeNull();
    expect(chat!.y + chat!.height).toBeLessThanOrEqual(nav!.y + 1);
  });
});

/**
 * The page could not be scrolled while a modal was open: every overlay is
 * `fixed inset-0` and nothing froze the document underneath, so a swipe moved
 * the page while the panel stayed put — the screen read as stuck. Overlays also
 * had no scroll container, leaving a panel taller than the viewport unreachable.
 */
test.describe("Mobile scrolling", () => {
  test("scrolls the page on every screen", async ({ page }) => {
    await page.goto("/");

    for (const tab of ALL_TABS) {
      await gotoTabMobile(page, tab);
      await page.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));

      const range = await page.evaluate(
        () => document.documentElement.scrollHeight - document.documentElement.clientHeight
      );
      if (range < 200) continue; // Short screen, nothing to scroll.

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => window.scrollBy(0, 400));
      expect(await page.evaluate(() => Math.round(window.scrollY)), tab).toBeGreaterThan(0);
    }
  });

  test("keeps the top bar stuck while scrolling", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 900);
    });

    // `overflow-x: hidden` on the root makes it a scroll container, which
    // silently breaks `position: sticky` inside it. `clip` does not.
    const navTop = await page.evaluate(
      () => document.querySelector("nav")?.getBoundingClientRect().top ?? -1
    );
    expect(Math.round(navTop)).toBe(0);
  });

  test("freezes the page behind an open modal and restores the position", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 400);
    });
    const before = await page.evaluate(() => Math.round(window.scrollY));
    expect(before).toBeGreaterThan(0);

    await page.locator("#login-profile-btn").dispatchEvent("click");
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Driven through the wheel rather than window.scrollBy: the lock works on
    // the events a person actually generates, and a synthetic scroll would be
    // testing a stricter promise than the one that matters.
    await page.mouse.move(180, 300);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(before);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(before);
    // And the page scrolls again once it is closed.
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(before);
  });

  test("stops the sheet where the bottom navigation begins", async ({ page }) => {
    await page.goto("/");
    await page.locator("#login-profile-btn").dispatchEvent("click");

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const geometry = await dialog.evaluate((el) => {
      const nav = document.querySelector("#mobile-bottom-nav");
      return {
        dialogBottom: el.getBoundingClientRect().bottom,
        navTop: nav ? nav.getBoundingClientRect().top : null,
      };
    });

    // The sheet used to run 65px under the bar, which is what "the modal sits
    // too low" meant: its last stretch was behind the navigation.
    expect(geometry.navTop, "the bottom navigation should be present").not.toBeNull();
    expect(geometry.dialogBottom).toBeLessThanOrEqual(geometry.navTop! + 2);
  });

  test("keeps a tall dialog inside the viewport and scrollable", async ({ page }) => {
    await page.goto("/");
    await page.locator("#login-profile-btn").dispatchEvent("click");

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const box = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const scroller = el.querySelector(".overflow-y-auto");
      return {
        top: r.top,
        bottom: r.bottom,
        vh: window.innerHeight,
        hasScroller: Boolean(scroller),
      };
    });

    // A sheet rises from the bottom edge and never overflows the top, so no
    // part of it is unreachable however long the content runs.
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(Math.round(box.bottom)).toBeLessThanOrEqual(Math.round(box.vh) + 1);
    expect(box.hasScroller, "the dialog body must scroll inside itself").toBe(true);
  });
});

test.describe("Mobile modal chrome", () => {
  test("pins the modal close button to the top-right corner", async ({ page }) => {
    await page.goto("/");
    await page.locator("#login-profile-btn").dispatchEvent("click");

    const close = page.locator('[aria-label="Cerrar modal"]');
    await expect(close).toBeVisible();

    const geometry = await close.evaluate((el) => {
      const panel = el.closest('[role="dialog"]') as HTMLElement;
      const b = el.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      return {
        fromRight: p.right - b.right,
        fromTop: b.top - p.top,
        inViewport: b.top >= 0 && b.bottom <= window.innerHeight,
      };
    });

    // Position is no longer asserted as `absolute`: the shared Modal pins it in
    // a sticky header, which is what stops it scrolling out of reach. What
    // matters is where it lands and that it is on screen.
    expect(geometry.fromRight).toBeLessThan(32);
    expect(geometry.fromTop).toBeLessThan(48);
    expect(geometry.inViewport).toBe(true);
  });

  test("no element is overridden by a custom class it declares a utility against", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#login-profile-btn").dispatchEvent("click");
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const collisions = await page.evaluate(() => {
      const expected: Record<string, [string, string]> = {
        absolute: ["position", "absolute"],
        fixed: ["position", "fixed"],
        sticky: ["position", "sticky"],
        flex: ["display", "flex"],
        hidden: ["display", "none"],
      };
      const found: string[] = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const classes = (el.className || "").toString().split(/\s+/);
        const style = getComputedStyle(el);
        for (const c of classes) {
          const rule = expected[c];
          if (!rule) continue;
          if (style[rule[0] as never] !== rule[1]) {
            found.push(`${el.tagName.toLowerCase()}.${c}: ${rule[0]}=${style[rule[0] as never]}`);
          }
        }
      }
      return Array.from(new Set(found));
    });

    expect(collisions, collisions.join(" | ")).toEqual([]);
  });
  /**
   * Regression: `<main>` carries `.animate-fade-in`, whose animation used to
   * fill `both`. A filling `transform` — even one whose keyframe says `none` —
   * makes the element the containing block for its `position: fixed`
   * descendants, so every overlay in the application was laid out against the
   * height of the page instead of the viewport. Measured here at 375px, the
   * scholarship filter sheet sat at y=3268 inside a 6583px-tall backdrop.
   *
   * This has to be an end-to-end test: it is a containing-block resolution,
   * which only a real layout engine performs.
   */
  test("positions a fixed overlay against the viewport, not the page", async ({ page }) => {
    await page.goto("/");
    await gotoTabMobile(page, "becas");
    await page.locator("#btn-open-mobile-filters").click();

    const backdrop = page.locator("div.fixed.inset-0").last();
    await expect(backdrop).toBeVisible();
    const box = await backdrop.boundingBox();
    const viewport = page.viewportSize();

    expect(box, "the filter sheet backdrop should be laid out").not.toBeNull();
    expect(viewport).not.toBeNull();

    // `inset-0` on a viewport-relative fixed element covers the viewport and
    // nothing more. A containing block elsewhere shows up as a backdrop taller
    // than the screen, starting somewhere far off the top.
    expect(Math.abs(box!.y)).toBeLessThanOrEqual(2);
    expect(box!.height).toBeLessThanOrEqual(viewport!.height + 2);
  });

  /**
   * The mechanism itself, so the next animation added to a page-level wrapper
   * cannot quietly reintroduce it.
   */
  test("leaves no transform on the ancestors of a fixed overlay", async ({ page }) => {
    await page.goto("/");
    await gotoTabMobile(page, "becas");
    await page.locator("#btn-open-mobile-filters").click();
    await expect(page.locator("div.fixed.inset-0").last()).toBeVisible();
    // Long enough for every entrance animation on the screen to have finished.
    await page.waitForTimeout(700);

    const offenders = await page.evaluate(() => {
      const found: string[] = [];
      for (const overlay of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
        if (getComputedStyle(overlay).position !== "fixed") continue;
        let el = overlay.parentElement;
        while (el && el !== document.documentElement) {
          const transform = getComputedStyle(el).transform;
          if (transform !== "none") {
            const name = el.getAttribute("class") ?? el.tagName.toLowerCase();
            found.push(`${name.slice(0, 60)} -> ${transform}`);
          }
          el = el.parentElement;
        }
      }
      return Array.from(new Set(found));
    });

    // A transform anywhere above a fixed element redefines what "fixed" means
    // for it: the element is positioned against that ancestor instead of the
    // viewport. `animation-fill-mode: both` is the quiet way to acquire one.
    expect(offenders, offenders.join(" | ")).toEqual([]);
  });
});

/**
 * Focus behaviour, verified in a real browser. jsdom does not model Radix's
 * focus scope faithfully, so these cannot live in the component suite.
 */
test.describe("Mobile dialog focus", () => {
  test("keeps focus inside the dialog and returns it to the trigger", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator("#login-profile-btn");

    // Focused first, then opened with the keyboard. Restoration only means
    // something for a keyboard user: a tap does not focus a button on mobile,
    // so there is genuinely nothing to restore afterwards.
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Tab many times over: focus must never escape to the page behind, which is
    // what every hand-rolled overlay allowed.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
        `focus escaped the dialog on Tab ${i + 1}`
      ).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    // Otherwise a keyboard user is dropped at the top of the document.
    await expect(trigger).toBeFocused();
  });
});
