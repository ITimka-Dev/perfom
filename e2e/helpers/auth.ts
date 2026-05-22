import { Page, expect } from '@playwright/test';

const LOGIN_PATHS = ['/', '/auth', '/login', '/signin'];

export const studentCredentials = {
  email: process.env.E2E_STUDENT_EMAIL ?? process.env.E2E_EMAIL ?? 'testing@testing.ru',
  password: process.env.E2E_STUDENT_PASSWORD ?? process.env.E2E_PASSWORD ?? 'testing-testing',
};

export const teacherCredentials = {
  email: process.env.E2E_TEACHER_EMAIL ?? process.env.E2E_EMAIL ?? 'testing@testing.ru',
  password: process.env.E2E_TEACHER_PASSWORD ?? process.env.E2E_PASSWORD ?? 'testing-testing',
};

export async function openLoginPage(page: Page): Promise<void> {
  for (const path of LOGIN_PATHS) {
    await page.goto(path);
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.first().isVisible().catch(() => false)) {
      return;
    }
  }

  throw new Error('Login page with email/password inputs was not found');
}

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await openLoginPage(page);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

export async function loginAsStudent(page: Page): Promise<void> {
  await loginWithCredentials(page, studentCredentials.email, studentCredentials.password);
}

export async function loginAsTeacher(page: Page): Promise<void> {
  await loginWithCredentials(page, teacherCredentials.email, teacherCredentials.password);
}

export async function expectLoginFormVisible(page: Page): Promise<void> {
  await openLoginPage(page);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
}
