import { test, expect } from '@playwright/test';
import {
  ALL_TABS,
  gotoTabMobile,
  expectNoHorizontalOverflow,
  findSmallTapTargets,
} from './helpers';

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

test.describe('Mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('never scrolls horizontally on any screen', async ({ page }) => {
    await expectNoHorizontalOverflow(page, 'home');

    for (const tab of ALL_TABS.filter((t) => t !== 'home')) {
      await gotoTabMobile(page, tab);
      await expectNoHorizontalOverflow(page, tab);
    }
  });

  test('keeps the layout viewport at the device width', async ({ page }) => {
    // If content overflows, mobile browsers shrink the page to fit and
    // innerWidth reports the wider layout instead of the device width.
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(innerWidth).toBe(viewportWidth(page));
  });

  test('shows the account, alerts and theme controls inside the viewport', async ({ page }) => {
    for (const id of ['#login-profile-btn', '#alerts-center-btn', '#mobile-menu-toggle']) {
      const box = await page.locator(id).boundingBox();
      expect(box, `${id} should be rendered`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${id} must fit inside the viewport`).toBeLessThanOrEqual(
        viewportWidth(page)
      );
    }
  });

  test('hides the desktop navigation and shows the bottom bar', async ({ page }) => {
    await expect(page.locator('#mobile-bottom-nav')).toBeVisible();
    await expect(page.locator('#nav-item-becas')).toBeHidden();
  });
});

test.describe('Mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navigates between main screens from the bottom bar in one tap', async ({ page }) => {
    await page.locator('#bottom-nav-becas').click();
    await expect(page.locator('text=Directorio Oficial de Becas')).toBeVisible();
    await expect(page.locator('#bottom-nav-becas')).toHaveAttribute('aria-current', 'page');

    await page.locator('#bottom-nav-guia').click();
    await expect(page.locator('text=Guías Oficiales Paso a Paso').first()).toBeVisible();

    await page.locator('#bottom-nav-home').click();
    await expect(page.locator('h1').first()).toContainText('Tu futuro no tiene fronteras');
  });

  test('opens the drawer from the bottom bar menu button', async ({ page }) => {
    await page.locator('#bottom-nav-menu').click();
    await expect(page.locator('#mobile-nav-drawer')).toBeVisible();

    await page.locator('#drawer-nav-item-calculadora').click();
    await expect(page.locator('#mobile-nav-drawer')).toBeHidden();
    await expect(page.locator('h1').first()).toContainText('Calculadora de Costo de Vida');
  });

  test('closes the drawer with Escape', async ({ page }) => {
    await page.locator('#mobile-menu-toggle').click();
    await expect(page.locator('#mobile-nav-drawer')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav-drawer')).toBeHidden();
  });

  test('restores the reading position when the drawer is dismissed', async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' as ScrollBehavior }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const before = await page.evaluate(() => window.scrollY);

    // dispatchEvent rather than click(): the toggle lives in a sticky header,
    // and Playwright's actionability check scrolls the page to the top before
    // clicking it, which would destroy the position under test. A real tap on
    // an already-visible sticky control scrolls nothing.
    await page.locator('#mobile-menu-toggle').dispatchEvent('click');
    await expect(page.locator('#mobile-nav-drawer')).toBeVisible();
    // Dismiss without navigating.
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav-drawer')).toBeHidden();

    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(30);
  });
});

test.describe('Mobile ergonomics', () => {
  test('gives form controls a 16px font so iOS does not zoom on focus', async ({ page }) => {
    await page.goto('/');
    await page.locator('#bottom-nav-becas').click();

    const fontSize = await page
      .locator('#becas-search-input')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test('keeps navigation and account controls at a usable touch size', async ({ page }) => {
    await page.goto('/');

    const controls = [
      '#mobile-menu-toggle',
      '#login-profile-btn',
      '#alerts-center-btn',
      '#bottom-nav-home',
      '#bottom-nav-becas',
      '#bottom-nav-menu',
    ];

    for (const id of controls) {
      const box = await page.locator(id).boundingBox();
      expect(box, `${id} should be rendered`).not.toBeNull();
      expect(box!.height, `${id} height`).toBeGreaterThanOrEqual(40);
      expect(box!.width, `${id} width`).toBeGreaterThanOrEqual(40);
    }
  });

  test('has no undersized controls on the home screen', async ({ page }) => {
    await page.goto('/');
    const offenders = await findSmallTapTargets(page, 32);
    expect(offenders, `undersized controls: ${offenders.join(', ')}`).toEqual([]);
  });

  test('does not let the floating chat button fall outside the viewport', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('#floating-chat-trigger-btn').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth(page));

    // And it must be clickable rather than hidden behind page content.
    await page.locator('#floating-chat-trigger-btn').click();
    await expect(page.locator('#floating-chat-popup')).toBeVisible();
  });

  test('keeps the floating chat clear of the bottom navigation', async ({ page }) => {
    await page.goto('/');
    const chat = await page.locator('#floating-chat-trigger-btn').boundingBox();
    const nav = await page.locator('#mobile-bottom-nav').boundingBox();

    expect(chat).not.toBeNull();
    expect(nav).not.toBeNull();
    expect(chat!.y + chat!.height).toBeLessThanOrEqual(nav!.y + 1);
  });
});
