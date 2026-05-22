import { test, expect } from '@playwright/test';
import { loginAsStudent } from '../helpers/auth';

test.skip(!process.env.RUN_VISUAL, 'Visual snapshots run only when RUN_VISUAL is set');

async function loginAndGoToFarm(page) {
  await loginAsStudent(page);
  await page.goto('/farm');
  await page.waitForLoadState('networkidle');
}

test.describe('Farm Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFarm(page);
  });

  test('farm zones grid should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('farm-zones-grid.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('individual farm zone card should match baseline', async ({ page }) => {
    const firstZone = page.locator('[data-testid="farm-zone"]').first();
    await expect(firstZone).toHaveScreenshot('farm-zone-card.png');
  });

  test('zone view with slots should match baseline', async ({ page }) => {
    await page.click('[data-testid="farm-zone"]:first-child');
    await page.waitForTimeout(1000); // Wait for animation
    
    await expect(page).toHaveScreenshot('farm-zone-view.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('text=/\\d+:\\d+:\\d+/')], // Mask timers
    });
  });

  test('plant slot should match baseline', async ({ page }) => {
    await page.click('[data-testid="farm-zone"]:first-child');
    await page.waitForTimeout(1000);
    
    const plantSlot = page.locator('[data-testid="plant-slot"]').first();
    await expect(plantSlot).toHaveScreenshot('plant-slot.png', {
      mask: [page.locator('text=/\\d+:\\d+/')], // Mask timers
    });
  });
});
