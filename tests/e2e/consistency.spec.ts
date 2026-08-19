import { test, expect } from "@playwright/test";

/**
 * Country selection is shared app-wide, and nothing is persisted to browser
 * storage. Both are easy to regress silently, so they are pinned here.
 */

test.describe("Country selection consistency", () => {
  test("a destination picked in the guides carries over to the planner", async ({ page }) => {
    await page.goto("/");

    await page.locator("#nav-item-guia").click();
    await page
      .getByRole("button", { name: /Alemania/i })
      .first()
      .click();
    await expect(page.locator("text=Tipos de Visado en Alemania").first()).toBeVisible();

    // Open the planner from the grouped tools menu.
    await page.locator("#nav-tools-menu-btn").click();
    await page.locator("#nav-item-planificador").click();

    await expect(page.locator("#planner-destination-country")).toHaveValue("Alemania");
  });

  // Uses Alemania rather than Portugal on purpose: LOCATIONS_DATA only covers
  // Alemania, Canadá, EE.UU., España, Reino Unido and Suiza, so a destination
  // outside that set has no consular entries for the map to select.
  test("a destination picked in the guides carries over to the consular map", async ({ page }) => {
    await page.goto("/");

    await page.locator("#nav-item-guia").click();
    await page
      .getByRole("button", { name: /Alemania/i })
      .first()
      .click();

    await page.locator("#nav-item-mapa").click();
    await expect(page.locator("#map-destination-filter")).toHaveValue("Alemania");
  });

  test("the scholarship catalogue is not pre-filtered before the user chooses", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#nav-item-becas").click();

    // With no country chosen yet, every country's scholarships are listed.
    await expect(page.locator("text=Fundación Carolina").first()).toBeVisible();
    await expect(page.locator("text=22 convocatorias").first()).toBeVisible();
  });
});

test.describe("Browser storage", () => {
  test("writes nothing to localStorage or sessionStorage while browsing", async ({ page }) => {
    await page.goto("/");

    // Exercise the settings that used to be persisted.
    await page.locator("#preferences-menu-btn").click();
    await page.locator("#theme-toggle-btn").click();
    await page.locator("#lang-toggle-btn").click();
    await page.locator("#currency-select-nav").selectOption("USD");
    await page.keyboard.press("Escape");

    await page.locator("#nav-item-becas").click();

    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));

    expect(stored.local).toEqual([]);
    expect(stored.session).toEqual([]);
  });
});

test.describe("Desktop navigation", () => {
  test("fits the bar without overlapping the account controls", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    const lastNavItem = await page.locator("#nav-tools-menu-btn").boundingBox();
    const firstAction = await page.locator("#alerts-center-btn").boundingBox();

    expect(lastNavItem).not.toBeNull();
    expect(firstAction).not.toBeNull();
    expect(
      lastNavItem!.x + lastNavItem!.width,
      "navigation must end before the account controls begin"
    ).toBeLessThanOrEqual(firstAction!.x + 1);
  });

  test("reaches secondary screens through the tools menu", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#nav-item-calculadora")).toBeHidden();
    await page.locator("#nav-tools-menu-btn").click();
    await expect(page.locator("#nav-tools-menu")).toBeVisible();

    await page.locator("#nav-item-calculadora").click();
    await expect(page.locator("#nav-tools-menu")).toBeHidden();
    await expect(page.locator("text=Calculadora").first()).toBeVisible();
  });

  test("closes the tools menu when clicking outside", async ({ page }) => {
    await page.goto("/");

    await page.locator("#nav-tools-menu-btn").click();
    await expect(page.locator("#nav-tools-menu")).toBeVisible();

    await page.locator("h1").first().click();
    await expect(page.locator("#nav-tools-menu")).toBeHidden();
  });

  test("groups currency, language and theme under one preferences menu", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#currency-select-nav")).toBeHidden();
    await page.locator("#preferences-menu-btn").click();

    await expect(page.locator("#currency-select-nav")).toBeVisible();
    await expect(page.locator("#lang-toggle-btn")).toBeVisible();
    await expect(page.locator("#theme-toggle-btn")).toBeVisible();
  });
});

/**
 * Preferences used to be in-memory only, so every reload reset the theme,
 * language, currency and both country choices. An anonymous visitor now keeps
 * them in the `lm_prefs` cookie; a signed-in one keeps them in Firestore and
 * nothing in the browser.
 */
test.describe("Preference persistence", () => {
  test("keeps the theme across a reload", async ({ page }) => {
    await page.goto("/");

    const isDark = () => page.evaluate(() => document.documentElement.classList.contains("dark"));

    const before = await isDark();
    await page.locator("#preferences-menu-btn").click();
    await page.locator("#theme-toggle-btn").click();
    await expect.poll(isDark).toBe(!before);

    await page.reload();
    await expect.poll(isDark).toBe(!before);
  });

  test("keeps the destination country across a reload", async ({ page }) => {
    await page.goto("/");
    await page.locator("#nav-item-guia").click();
    await page
      .getByRole("button", { name: /Alemania/i })
      .first()
      .click();

    await page.waitForTimeout(600); // past the write debounce
    await page.reload();

    // The planner reads the same context, so the choice must survive there too.
    await page.locator("#nav-tools-menu-btn").click();
    await page.locator("#nav-item-planificador").click();
    await expect(page.locator("#planner-destination-country")).toHaveValue("Alemania");
  });

  test("stores preferences in a cookie and never in browser storage", async ({ page }) => {
    await page.goto("/");
    await page.locator("#preferences-menu-btn").click();
    await page.locator("#theme-toggle-btn").click();
    await page.waitForTimeout(600); // past the write debounce

    const cookies = await page.context().cookies();
    const prefs = cookies.find((c) => c.name === "lm_prefs");
    expect(prefs, "lm_prefs cookie was not written").toBeTruthy();

    // Display choices only: no identifier, nothing personal.
    expect(Object.keys(JSON.parse(decodeURIComponent(prefs!.value)))).toEqual(
      expect.arrayContaining(["theme"])
    );
    expect(prefs!.sameSite).toBe("Lax");

    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storage.local).toEqual([]);
    expect(storage.session).toEqual([]);
  });

  test("clearing preferences restores the defaults", async ({ page }) => {
    await page.goto("/");

    const isDark = () => page.evaluate(() => document.documentElement.classList.contains("dark"));
    const before = await isDark();

    await page.locator("#preferences-menu-btn").click();
    await page.locator("#theme-toggle-btn").click();
    await expect.poll(isDark).toBe(!before);
    await page.waitForTimeout(600);

    // The menu is still open from the toggle above; clicking the trigger again
    // would close it.
    await page.locator("#clear-preferences-btn").click();

    await expect(page.getByText(/Preferencias borradas|Preferences cleared/)).toBeVisible();
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "lm_prefs")?.value || "").toBe("");
  });
});
