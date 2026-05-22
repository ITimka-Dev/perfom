import { test, expect } from '@playwright/test';
import { loginAsTeacher } from './helpers/auth';

test.describe('Task Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('should navigate to create task page', async ({ page }) => {
    await page.click('text=/create task|new task/i');
    await page.waitForURL('**/tasks/create', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/create task/i);
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks/create');
    
    // Fill task form
    await page.fill('input[name="title"]', 'Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task description');
    
    // Select subject
    await page.click('button:has-text("Select Subject")');
    await page.click('text=/mathematics|math/i');
    
    // Set difficulty
    await page.click('button:has-text("Select Difficulty")');
    await page.click('text=/medium/i');
    
    // Set due date
    await page.fill('input[type="date"]', '2025-12-31');
    
    // Set points
    await page.fill('input[name="points"]', '50');
    
    // Submit form
    await page.click('button[type="submit"]:has-text(/create|submit/i)');
    
    // Should redirect to tasks list
    await page.waitForURL('**/tasks', { timeout: 10000 });
    
    // Verify task appears in list
    await expect(page.locator('text=Test Task')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/tasks/create');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]:has-text(/create|submit/i)');
    
    // Should show validation errors
    await expect(page.locator('text=/required|fill/i')).toBeVisible({ timeout: 3000 });
  });

  test('should upload attachment to task', async ({ page }) => {
    await page.goto('/tasks/create');
    
    // Fill basic fields
    await page.fill('input[name="title"]', 'Task with Attachment');
    await page.fill('textarea[name="description"]', 'Task description');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content'),
    });
    
    // Verify file is selected
    await expect(page.locator('text=/test.pdf/i')).toBeVisible({ timeout: 3000 });
  });

  test('should assign task to group', async ({ page }) => {
    await page.goto('/tasks/create');
    
    // Fill basic fields
    await page.fill('input[name="title"]', 'Group Task');
    await page.fill('textarea[name="description"]', 'Task for group');
    
    // Select group
    await page.click('button:has-text("Select Group")');
    await page.click('[role="option"]:first-child');
    
    // Submit
    await page.click('button[type="submit"]:has-text(/create|submit/i)');
    
    await page.waitForURL('**/tasks', { timeout: 10000 });
  });
});
