import { defineConfig, devices } from '@playwright/test';

/**
 * E2E + responsive tests. Uses the locally installed Chrome (channel: 'chrome')
 * so no browser download is required. The Vite dev server is started
 * automatically unless one is already running on :5190.
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5190',
    channel: 'chrome',
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --port 5190 --strictPort',
    url: 'http://localhost:5190',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'laptop-1366', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-390', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 }, channel: 'chrome' } },
    { name: 'mobile-320', use: { ...devices['Pixel 5'], viewport: { width: 320, height: 568 }, channel: 'chrome' } },
  ],
});
