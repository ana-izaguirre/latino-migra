import { test, expect } from "@playwright/test";

test.describe("LatinoMigra - End to End Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
  });

  test("1. Pantalla Inicio (Home): Carga completa, navegación y buscador", async ({ page }) => {
    // Check main branding
    await expect(page.locator("text=LatinoMigra").first()).toBeVisible();

    // Check Hero title text
    await expect(page.locator("h1").first()).toContainText("Tu futuro no tiene fronteras");

    // Check main navigation links exist in navbar
    const navBar = page.locator("nav").first();
    await expect(navBar).toBeVisible();
    await expect(page.locator("#nav-item-becas")).toBeVisible();
    await expect(page.locator("#nav-item-guia")).toBeVisible();
    await expect(page.locator("#nav-item-chat")).toBeVisible();
    await expect(page.locator("#nav-item-mapa")).toBeVisible();
    // Secondary destinations live behind the grouped tools menu.
    await expect(page.locator("#nav-tools-menu-btn")).toBeVisible();
    await page.locator("#nav-tools-menu-btn").click();
    await expect(page.locator("#nav-item-comunidad")).toBeVisible();
    await page.keyboard.press("Escape");

    // No catalogue figures on the first screen: the badge claimed "+5,000
    // Becas Activas" against a catalogue of 22.
    await expect(page.getByText(/\+5,000/)).toHaveCount(0);
  });

  test("2. Pantalla Explorador de Becas: Filtros, búsqueda y modal de detalle", async ({
    page,
  }) => {
    // Click on "Becas" tab
    await page.locator("#nav-item-becas").click();

    // Verify Becas heading
    await expect(page.locator("text=Directorio Oficial de Becas")).toBeVisible();

    // Search for a specific scholarship
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Fundación Carolina");

    // Verify filtered card is visible
    await expect(page.locator("text=Fundación Carolina").first()).toBeVisible();

    // Open Scholarship Detail Modal
    await page
      .locator("button", { hasText: /Ver Detalles/i })
      .first()
      .click();

    // Check modal detail is displayed
    await expect(page.locator("text=Requisitos Principales").first()).toBeVisible();

    // Close the modal
    const closeButton = page
      .locator('button[aria-label="Cerrar modal"], button:has(svg.lucide-x)')
      .first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("3. Pantalla Guías de Trámites y Migración: Selección de países y calculadora", async ({
    page,
  }) => {
    // Click on "Guía de Migración" tab
    await page.locator("#nav-item-guia").click();

    // Verify Guías header
    await expect(page.locator("text=Guías Oficiales Paso a Paso").first()).toBeVisible();

    // Change country tab to "Alemania"
    const alemaniaBtn = page.getByRole("button", { name: /Alemania/i });
    if (await alemaniaBtn.isVisible()) {
      await alemaniaBtn.click();
      await expect(page.locator("text=Tipos de Visado en Alemania").first()).toBeVisible();
    }

    // Verify step cards / checklist exist
    await expect(page.locator("text=Documentación Clave Requerida").first()).toBeVisible();
  });

  test("4. Pantalla Asistente IA Migratorio: Interfaz de chat y prompts sugeridos", async ({
    page,
  }) => {
    // Click on "Chat IA" tab
    await page.locator("#nav-item-chat").click();

    // Verify AI Chat interface
    await expect(page.locator("text=LatinoMigra IA").first()).toBeVisible();

    // Check prompt input is ready
    const messageInput = page.getByPlaceholder(/Pregunta sobre visas/i);
    await expect(messageInput).toBeVisible();
  });

  test("5. Pantalla Directorio Consular: Tarjetas de consulados y emergencias", async ({
    page,
  }) => {
    // Click on "Mapa Consular" tab
    await page.locator("#nav-item-mapa").click();

    // Verify Consular directory title
    await expect(page.locator("text=Consulados, Embajadas y Campus Destino")).toBeVisible();

    // Verify country filters exist
    await expect(page.locator("text=Tu País de Origen:")).toBeVisible();
    await expect(page.locator("#select-user-country")).toBeVisible();
  });

  test("6. Pantalla Comunidad: Historias de éxito y red de apoyo", async ({ page }) => {
    // Click on "Comunidad" tab
    await page.locator("#nav-tools-menu-btn").click();
    await page.locator("#nav-item-comunidad").click();

    // Verify Comunidad heading
    await expect(page.locator("h1").first()).toContainText("Foros y Experiencias");

    // Verify forum search or button
    await expect(page.locator("#new-post-forum-btn")).toBeVisible();
  });

  test("7. Cambio de Tema: alterna entre Modo Claro y Modo Oscuro", async ({ page }) => {
    // The theme control now lives inside the preferences menu.
    await page.locator("#preferences-menu-btn").click();
    const themeToggleBtn = page.locator("#theme-toggle-btn");
    await expect(themeToggleBtn).toBeVisible();

    // Click to toggle dark mode
    await themeToggleBtn.click();

    // Verify html element has or toggles class 'dark'
    const htmlElement = page.locator("html");
    const isDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));

    // Toggle again
    await themeToggleBtn.click();
    const isNowDifferent = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    expect(isDark).not.toEqual(isNowDifferent);
  });

  test("8. Modal de Autenticación / Registro Google", async ({ page }) => {
    // Click on "Acceder con Google" button in TopNavBar
    const authBtn = page.locator("#login-profile-btn");
    await expect(authBtn).toBeVisible();
    await authBtn.click();

    // Check Auth modal header appears
    await expect(page.locator("text=Inicia Sesión con Google").first()).toBeVisible();

    // Close modal
    const closeBtn = page.locator("button:has(svg.lucide-x)").first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
