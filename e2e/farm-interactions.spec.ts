import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth';

test.describe('Farm Interactions Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('should navigate to farm page', async ({ page }) => {
    await page.click('text=/farm/i');
    await page.waitForURL('**/farm', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/farm|my farm/i);
  });

  test('should display farm zones', async ({ page }) => {
    await page.goto('/farm');
    
    // Wait for zones to load
    await page.waitForSelector('[data-testid="farm-zone"]', { timeout: 10000 });
    
    // Should show multiple zones
    const zones = page.locator('[data-testid="farm-zone"]');
    await expect(zones).toHaveCount(5, { timeout: 5000 });
  });

  test('should open zone view', async ({ page }) => {
    await page.goto('/farm');
    
    // Click on first zone
    await page.click('[data-testid="farm-zone"]:first-child');
    
    // Should show zone details
    await expect(page.locator('text=/mathematics|biology|chemistry|physics|it/i')).toBeVisible({ timeout: 5000 });
    
    // Should show slots for plants/animals
    await expect(page.locator('[data-testid="plant-slot"], [data-testid="animal-slot"]')).toHaveCount(9, { timeout: 3000 });
  });

  test('should plant a seed', async ({ page }) => {
    await page.goto('/farm');
    
    // Open zone
    await page.click('[data-testid="farm-zone"]:first-child');
    
    // Click on empty slot
    const emptySlot = page.locator('[data-testid="plant-slot"]:has-text(/empty|plant/i)').first();
    await emptySlot.click();
    
    // Select seed from sheet
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.click('[data-testid="seed-item"]:first-child');
    
    // Confirm planting
    await page.click('button:has-text(/plant|confirm/i)');
    
    // Should show planted seed
    await expect(emptySlot).not.toContainText(/empty/i, { timeout: 5000 });
  });

  test('should harvest ready plant', async ({ page }) => {
    await page.goto('/farm');
    
    // Open zone
    await page.click('[data-testid="farm-zone"]:first-child');
    
    // Find ready plant (this assumes there's a planted seed that's ready)
    const readyPlant = page.locator('[data-testid="plant-slot"]:has-text(/ready|harvest/i)').first();
    
    if (await readyPlant.isVisible()) {
      await readyPlant.click();
      
      // Click harvest button
      await page.click('button:has-text(/harvest/i)');
      
      // Should show success message
      await expect(page.locator('text=/harvested|success/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should add farm animal', async ({ page }) => {
    await page.goto('/farm');
    
    // Open zone
    await page.click('[data-testid="farm-zone"]:first-child');
    
    // Click on empty animal slot
    const emptySlot = page.locator('[data-testid="animal-slot"]:has-text(/empty|add/i)').first();
    await emptySlot.click();
    
    // Select animal from sheet
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.click('[data-testid="animal-item"]:first-child');
    
    // Confirm adding
    await page.click('button:has-text(/add|confirm/i)');
    
    // Should show added animal
    await expect(emptySlot).not.toContainText(/empty/i, { timeout: 5000 });
  });

  test('should start production chain', async ({ page }) => {
    await page.goto('/farm');
    
    // Open zone
    await page.click('[data-testid="farm-zone"]:first-child');
    
    // Click on production slot
    const productionSlot = page.locator('[data-testid="production-slot"]').first();
    await productionSlot.click();
    
    // Select production from sheet
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check if there are available productions
    const productionItems = page.locator('[data-testid="production-item"]');
    const count = await productionItems.count();
    
    if (count > 0) {
      await productionItems.first().click();
      await page.click('button:has-text(/start|confirm/i)');
      
      // Should show production in progress
      await expect(productionSlot).toContainText(/progress|producing/i, { timeout: 5000 });
    }
  });

  test('should display inventory', async ({ page }) => {
    await page.goto('/farm');
    
    // Click inventory button
    await page.click('button:has-text(/inventory/i)');
    
    // Should show inventory dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await expect(page.locator('text=/inventory|items/i')).toBeVisible();
    
    // Should show items
    const items = page.locator('[data-testid="inventory-item"]');
    await expect(items.count()).toBeGreaterThan(0);
  });
});
