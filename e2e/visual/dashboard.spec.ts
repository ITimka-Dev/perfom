import { test, expect } from '@playwright/test';
import { loginAsStudent } from '../helpers/auth';

test.skip(!process.env.RUN_VISUAL, 'Visual snapshots run only when RUN_VISUAL is set');

test.describe('Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('student dashboard should match baseline', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-student-full.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('text=/\\d{1,2}:\\d{2}/')], // Mask time displays
    });
  });

  test('dashboard stats cards should match baseline', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const statsSection = page.locator('[data-testid="stats-section"]').first();
    await expect(statsSection).toHaveScreenshot('dashboard-stats.png', {
      mask: [page.locator('text=/\\d+/')], // Mask dynamic numbers
    });
  });

  test('dashboard navigation should match baseline', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('dashboard-navigation.png');
  });
});
