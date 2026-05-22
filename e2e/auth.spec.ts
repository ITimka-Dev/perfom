import { test, expect } from '@playwright/test';
import {
  expectLoginFormVisible,
  loginWithCredentials,
  openLoginPage,
  studentCredentials,
} from './helpers/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await openLoginPage(page);
  });

  test('should display login page', async ({ page }) => {
    await expectLoginFormVisible(page);
  });

  test('should register new user', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    
    // Navigate to signup
    await page.click('text=/sign up|register/i');
    
    // Fill registration form
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should login existing user', async ({ page }) => {
    await loginWithCredentials(page, studentCredentials.email, studentCredentials.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', studentCredentials.password);
    
    await page.click('button[type="submit"]');
    
    // Should show validation error
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });
});
