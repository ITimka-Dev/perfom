import { test, expect } from '@playwright/test';
import { openLoginPage } from '../helpers/auth';

test.skip(!process.env.RUN_VISUAL, 'Visual snapshots run only when RUN_VISUAL is set');

test.describe('Homepage Visual Regression', () => {
  test('homepage should match baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('homepage header should match baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('homepage-header.png');
  });

  test('login form should match baseline', async ({ page }) => {
    await openLoginPage(page);
    await page.waitForLoadState('networkidle');
    
    const loginForm = page.locator('form');
    await expect(loginForm).toHaveScreenshot('login-form.png');
  });

  test('homepage mobile view should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
