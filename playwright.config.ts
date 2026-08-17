import { defineConfig, devices } from '@playwright/test';

/** Specs written against the touch layout. */
const MOBILE_SPECS = /mobile\.spec\.ts/;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only if explicitly needed */
  retries: process.env.CI ? 1 : 0,
  /* Run parallel workers in CI for much faster execution */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Allows running against a browser already present on the machine (e.g. a
     * container image that ships Chromium) instead of Playwright's pinned
     * download. Unset locally and in CI, where `npx playwright install` runs. */
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },

  /* Run chromium by default for ultra-fast CI; run all matrix only when FULL_E2E=true */
  /* mobile.spec.ts asserts touch-layout behaviour and must run on a phone
   * device; every other spec drives the desktop navigation, which is hidden
   * below the lg breakpoint. Keeping them in separate projects stops each
   * suite from running against a layout it was not written for. */
  projects: process.env.FULL_E2E === 'true'
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: MOBILE_SPECS },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: MOBILE_SPECS },
        { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: MOBILE_SPECS },
        { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] }, testMatch: MOBILE_SPECS },
        { name: 'Mobile Safari', use: { ...devices['iPhone 12'] }, testMatch: MOBILE_SPECS },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
          testIgnore: MOBILE_SPECS,
        },
        // Mobile is where the layout regressions live, so it runs by default
        // rather than only under FULL_E2E.
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
          testMatch: MOBILE_SPECS,
        },
      ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
