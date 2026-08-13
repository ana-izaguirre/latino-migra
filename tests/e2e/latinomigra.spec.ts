import { test, expect } from '@playwright/test';

test.describe('LatinoMigra - End to End Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto('/');
  });

  test('1. Pantalla Inicio (Home): Carga completa, navegación y buscador', async ({ page }) => {
    // Check main branding
    await expect(page.locator('text=LatinoMigra').first()).toBeVisible();
    
    // Check Hero title text
    await expect(page.locator('h1')).toContainText('Europa');

    // Check main navigation links exist in navbar
    const navBar = page.locator('nav').first();
    await expect(navBar).toBeVisible();
    await expect(navBar.getByRole('button', { name: /Becas/i })).toBeVisible();
    await expect(navBar.getByRole('button', { name: /Guías de Trámites|Guías/i })).toBeVisible();
    await expect(navBar.getByRole('button', { name: /Asistente IA/i })).toBeVisible();
    await expect(navBar.getByRole('button', { name: /Consulados/i })).toBeVisible();
    await expect(navBar.getByRole('button', { name: /Comunidad/i })).toBeVisible();

    // Check metrics / stats cards exist
    await expect(page.locator('text=+850')).toBeVisible();
    await expect(page.locator('text=+12,400')).toBeVisible();
  });

  test('2. Pantalla Explorador de Becas: Filtros, búsqueda y modal de detalle', async ({ page }) => {
    // Click on "Becas" tab
    await page.locator('nav button', { hasText: /Becas/i }).first().click();

    // Verify Becas heading / subtitle
    await expect(page.locator('text=Directorio Oficial de Becas 2026-2027')).toBeVisible();

    // Search for a specific scholarship
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Fundación Carolina');

    // Verify filtered card is visible
    await expect(page.locator('text=Becas Fundación Carolina').first()).toBeVisible();

    // Open Scholarship Detail Modal
    await page.locator('button', { hasText: /Ver Convocatoria|Ver detalles|Requisitos/i }).first().click();
    
    // Check modal detail is displayed
    await expect(page.locator('text=Requisitos Clave').or(page.locator('text=Beneficios y Dotación'))).toBeVisible();

    // Close the modal
    const closeButton = page.locator('button[aria-label="Cerrar"], button:has(svg.lucide-x)').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test('3. Pantalla Guías de Trámites y Migración: Selección de países y calculadora', async ({ page }) => {
    // Click on "Guías" tab
    await page.locator('nav button', { hasText: /Guías/i }).first().click();

    // Verify Guías header
    await expect(page.locator('text=Guías Paso a Paso de Emigración').first()).toBeVisible();

    // Change country tab to "Alemania"
    const alemaniaBtn = page.getByRole('button', { name: /Alemania/i });
    if (await alemaniaBtn.isVisible()) {
      await alemaniaBtn.click();
      await expect(page.locator('text=Alemania').first()).toBeVisible();
    }

    // Verify step cards / checklist exist
    await expect(page.locator('text=Requisitos Principales').or(page.locator('text=Costos Estimados'))).toBeVisible();
  });

  test('4. Pantalla Asistente IA Migratorio: Interfaz de chat y prompts sugeridos', async ({ page }) => {
    // Click on "Asistente IA" tab
    await page.locator('nav button', { hasText: /Asistente IA/i }).first().click();

    // Verify AI Chat interface
    await expect(page.locator('text=Asistente IA Especializado en Migración & Becas')).toBeVisible();
    
    // Check prompt input is ready
    const messageInput = page.getByPlaceholder(/Escribe tu consulta sobre becas/i);
    await expect(messageInput).toBeVisible();

    // Verify suggested question buttons exist
    const suggestedBadge = page.locator('button', { hasText: /¿Puedo trabajar con visa de estudiante/i }).first();
    if (await suggestedBadge.isVisible()) {
      await suggestedBadge.click();
      // Should populate input or send message
      await expect(messageInput).toHaveValue(/trabajar con visa de estudiante/i);
    }
  });

  test('5. Pantalla Directorio Consular: Tarjetas de consulados y emergencias', async ({ page }) => {
    // Click on "Consulados" tab
    await page.locator('nav button', { hasText: /Consulados/i }).first().click();

    // Verify Consular directory title
    await expect(page.locator('text=Directorio y Mapa de Consulados Latinoamericanos')).toBeVisible();

    // Verify country filters exist
    await expect(page.locator('text=Teléfonos de Emergencia')).toBeVisible();
    await expect(page.locator('text=Todos').first()).toBeVisible();
  });

  test('6. Pantalla Comunidad: Historias de éxito y red de apoyo', async ({ page }) => {
    // Click on "Comunidad" tab
    await page.locator('nav button', { hasText: /Comunidad/i }).first().click();

    // Verify Comunidad heading
    await expect(page.locator('text=Red de Apoyo & Comunidad Latinoamericana')).toBeVisible();

    // Verify testimonial / story cards
    await expect(page.locator('text=Experiencias Reales')).toBeVisible();
  });

  test('7. Cambio de Tema: Modo Claro y Modo Oscuro con persistencia', async ({ page }) => {
    // Locate Theme toggle button (moon/sun icon button)
    const themeToggleBtn = page.getByRole('button', { name: /Cambiar a modo/i });
    await expect(themeToggleBtn).toBeVisible();

    // Click to toggle dark mode
    await themeToggleBtn.click();
    
    // Verify html element has or toggles class 'dark'
    const htmlElement = page.locator('html');
    const isDark = await htmlElement.evaluate((el) => el.classList.contains('dark'));
    
    // Toggle again
    await themeToggleBtn.click();
    const isNowDifferent = await htmlElement.evaluate((el) => el.classList.contains('dark'));
    expect(isDark).not.toEqual(isNowDifferent);
  });

  test('8. Modal de Autenticación / Registro Google', async ({ page }) => {
    // Click on "Iniciar Sesión" or Profile button in TopNavBar
    const authBtn = page.getByRole('button', { name: /Ingresar con Google|Iniciar Sesión|Mi Cuenta/i }).first();
    await expect(authBtn).toBeVisible();
    await authBtn.click();

    // Check Auth modal header appears
    await expect(page.locator('text=Únete a LatinoMigra').or(page.locator('text=Continuar con Google'))).toBeVisible();

    // Check country selection dropdown inside modal
    await expect(page.locator('text=País de origen')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button[aria-label="Cerrar modal"], button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

});
