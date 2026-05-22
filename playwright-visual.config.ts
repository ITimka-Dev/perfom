import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/visual',
  fullyParallel: false, // Run visual tests sequentially for consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for visual regression
  reporter: [
    ['html', { outputFolder: 'playwright-report/visual' }],
    ['json', { outputFile: 'playwright-report/visual-results.json' }],
  ],
  use: {
    baseURL: process.env.VITE_API_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Visual regression specific settings
  expect: {
    toHaveScreenshot: {
      // Maximum pixel difference ratio
      maxDiffPixelRatio: 0.01,
      // Comparison threshold
      threshold: 0.2,
      // Animation handling
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent viewport for baseline
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
