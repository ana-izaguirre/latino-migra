import { test, expect } from '@playwright/test';

/**
 * Country selection is shared app-wide, and nothing is persisted to browser
 * storage. Both are easy to regress silently, so they are pinned here.
 */

test.describe('Country selection consistency', () => {
  test('a destination picked in the guides carries over to the planner', async ({ page }) => {
    await page.goto('/');

    await page.locator('#nav-item-guia').click();
    await page.getByRole('button', { name: /Alemania/i }).first().click();
    await expect(page.locator('text=Tipos de Visado en Alemania').first()).toBeVisible();

    // Open the planner from the grouped tools menu.
    await page.locator('#nav-tools-menu-btn').click();
    await page.locator('#nav-item-planificador').click();

    await expect(page.locator('#planner-destination-country')).toHaveValue('Alemania');
  });

  // Uses Alemania rather than Portugal on purpose: LOCATIONS_DATA only covers
  // Alemania, Canadá, EE.UU., España, Reino Unido and Suiza, so a destination
  // outside that set has no consular entries for the map to select.
  test('a destination picked in the guides carries over to the consular map', async ({ page }) => {
    await page.goto('/');

    await page.locator('#nav-item-guia').click();
    await page.getByRole('button', { name: /Alemania/i }).first().click();

    await page.locator('#nav-item-mapa').click();
    await expect(page.locator('#map-destination-filter')).toHaveValue('Alemania');
  });

  test('the scholarship catalogue is not pre-filtered before the user chooses', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-item-becas').click();

    // With no country chosen yet, every country's scholarships are listed.
    await expect(page.locator('text=Fundación Carolina').first()).toBeVisible();
    await expect(page.locator('text=22 convocatorias').first()).toBeVisible();
  });
});

test.describe('Browser storage', () => {
  test('writes nothing to localStorage or sessionStorage while browsing', async ({ page }) => {
    await page.goto('/');

    // Exercise the settings that used to be persisted.
    await page.locator('#preferences-menu-btn').click();
    await page.locator('#theme-toggle-btn').click();
    await page.locator('#lang-toggle-btn').click();
    await page.locator('#currency-select-nav').selectOption('USD');
    await page.keyboard.press('Escape');

    await page.locator('#nav-item-becas').click();

    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));

    expect(stored.local).toEqual([]);
    expect(stored.session).toEqual([]);
  });
});

test.describe('Desktop navigation', () => {
  test('fits the bar without overlapping the account controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const lastNavItem = await page.locator('#nav-tools-menu-btn').boundingBox();
    const firstAction = await page.locator('#alerts-center-btn').boundingBox();

    expect(lastNavItem).not.toBeNull();
    expect(firstAction).not.toBeNull();
    expect(
      lastNavItem!.x + lastNavItem!.width,
      'navigation must end before the account controls begin'
    ).toBeLessThanOrEqual(firstAction!.x + 1);
  });

  test('reaches secondary screens through the tools menu', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#nav-item-calculadora')).toBeHidden();
    await page.locator('#nav-tools-menu-btn').click();
    await expect(page.locator('#nav-tools-menu')).toBeVisible();

    await page.locator('#nav-item-calculadora').click();
    await expect(page.locator('#nav-tools-menu')).toBeHidden();
    await expect(page.locator('text=Calculadora').first()).toBeVisible();
  });

  test('closes the tools menu when clicking outside', async ({ page }) => {
    await page.goto('/');

    await page.locator('#nav-tools-menu-btn').click();
    await expect(page.locator('#nav-tools-menu')).toBeVisible();

    await page.locator('h1').first().click();
    await expect(page.locator('#nav-tools-menu')).toBeHidden();
  });

  test('groups currency, language and theme under one preferences menu', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#currency-select-nav')).toBeHidden();
    await page.locator('#preferences-menu-btn').click();

    await expect(page.locator('#currency-select-nav')).toBeVisible();
    await expect(page.locator('#lang-toggle-btn')).toBeVisible();
    await expect(page.locator('#theme-toggle-btn')).toBeVisible();
  });
});
