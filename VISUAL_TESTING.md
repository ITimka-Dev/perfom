# Visual Regression Testing Guide

This guide explains how to use visual regression testing to catch unintended UI changes in the EduFarm application.

## Overview

Visual regression testing automatically detects visual changes in your application by:
1. Taking screenshots (baselines) of your UI
2. Comparing new screenshots against baselines
3. Highlighting any differences

## Setup

### Install Dependencies

```bash
npm install @playwright/test --save-dev
npx playwright install --with-deps
```

### Generate Initial Baselines

```bash
# Generate baseline screenshots for all visual tests
npx playwright test --config=playwright-visual.config.ts --update-snapshots
```

This creates reference images in `e2e/visual/*.spec.ts-snapshots/`.

### Commit Baselines

```bash
git add e2e/visual/*.spec.ts-snapshots/
git commit -m "Add visual regression baselines"
git push
```

## Running Tests

### Run All Visual Tests

```bash
npx playwright test --config=playwright-visual.config.ts
```

### Run Specific Visual Test

```bash
npx playwright test e2e/visual/homepage.spec.ts --config=playwright-visual.config.ts
```

### Run in Headed Mode

```bash
npx playwright test --config=playwright-visual.config.ts --headed
```

### Debug Visual Tests

```bash
npx playwright test --config=playwright-visual.config.ts --debug
```

## Understanding Results

### When Tests Pass ✅

All screenshots match baselines within the configured threshold. No visual changes detected.

### When Tests Fail ❌

Visual differences detected. Review the differences:

```bash
npx playwright show-report playwright-report/visual
```

The report shows:
- **Expected**: Baseline screenshot
- **Actual**: Current screenshot
- **Diff**: Highlighted differences

## Handling Visual Changes

### 1. Intentional UI Changes

If you made deliberate UI changes:

```bash
# Update baselines for all tests
npx playwright test --config=playwright-visual.config.ts --update-snapshots

# Or update specific test
npx playwright test e2e/visual/homepage.spec.ts --update-snapshots
```

Then commit the new baselines:

```bash
git add e2e/visual/*.spec.ts-snapshots/
git commit -m "Update visual baselines after UI changes"
```

### 2. Unintentional Changes (Bugs)

If changes are unexpected:
1. Investigate the root cause
2. Fix the bug
3. Re-run tests to confirm they pass

### 3. Environmental Differences

Sometimes tests fail due to environment differences (fonts, rendering):

**Solution 1: Adjust threshold**
```typescript
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixelRatio: 0.02, // Allow 2% difference
});
```

**Solution 2: Mask dynamic content**
```typescript
await expect(page).toHaveScreenshot('page.png', {
  mask: [
    page.locator('text=/\\d{1,2}:\\d{2}/'), // Mask times
    page.locator('[data-testid="user-id"]'), // Mask user IDs
  ],
});
```

## Best Practices

### ✅ DO

**Disable Animations**
```typescript
await expect(page).toHaveScreenshot('page.png', {
  animations: 'disabled',
});
```

**Wait for Network Idle**
```typescript
await page.waitForLoadState('networkidle');
await expect(page).toHaveScreenshot('page.png');
```

**Use Consistent Viewports**
```typescript
test.use({ viewport: { width: 1280, height: 720 } });
```

**Mask Dynamic Content**
```typescript
await expect(page).toHaveScreenshot('page.png', {
  mask: [
    page.locator('text=/\\d+/'), // Numbers
    page.locator('.timestamp'), // Timestamps
  ],
});
```

### ❌ DON'T

- Take screenshots during animations
- Include random/dynamic data
- Use different viewport sizes for same test
- Screenshot areas with video/canvas (unless necessary)

## Configuration

### Threshold Settings

In `playwright-visual.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.01, // 1% difference allowed
    threshold: 0.2,          // Pixel color difference threshold
    animations: 'disabled',
  },
}
```

### Browser Support

Tests run on:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop Safari)

Configure in `playwright-visual.config.ts`.

## CI/CD Integration

### Automated Testing

Visual tests run automatically on:
- Pull requests → Compare against baseline
- Push to main → Update baselines automatically

### GitHub Actions Workflow

Located in `.github/workflows/visual-regression.yml`:
- Runs on every PR
- Uploads diff reports as artifacts
- Comments on PR with results

### Viewing CI Results

1. Go to GitHub Actions tab
2. Find your workflow run
3. Download `playwright-visual-report` artifact
4. Open `index.html` locally

## Writing New Visual Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Component Visual Tests', () => {
  test('component renders correctly', async ({ page }) => {
    await page.goto('/component');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('component-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
```

### Element-Specific Screenshots

```typescript
test('button renders correctly', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('button.primary');
  
  await expect(button).toHaveScreenshot('primary-button.png');
});
```

### Mobile Views

```typescript
test('mobile view matches baseline', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  await expect(page).toHaveScreenshot('mobile-view.png', {
    fullPage: true,
  });
});
```

### Multiple States

```typescript
test('button states', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('button');
  
  // Normal state
  await expect(button).toHaveScreenshot('button-normal.png');
  
  // Hover state
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
  
  // Focus state
  await button.focus();
  await expect(button).toHaveScreenshot('button-focus.png');
});
```

## Troubleshooting

### Tests Fail with Font Differences

**Cause**: Fonts not loaded or different across environments.

**Solution**: Wait for fonts to load
```typescript
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);
```

### Tests Fail with Minor Pixel Differences

**Cause**: Anti-aliasing differences between environments.

**Solution**: Increase threshold
```typescript
await expect(page).toHaveScreenshot('page.png', {
  threshold: 0.3, // More lenient
});
```

### Tests Pass Locally But Fail in CI

**Cause**: Environment differences (OS, fonts, rendering engine).

**Solution**: 
1. Use Docker for consistent environment
2. Generate baselines in CI
3. Adjust thresholds appropriately

### Baseline Images Out of Date

**Cause**: UI changed but baselines not updated.

**Solution**: Update baselines
```bash
npx playwright test --update-snapshots --config=playwright-visual.config.ts
```

## Performance Tips

### Run Visual Tests Separately

Visual tests are slower than functional tests:

```bash
# Run functional tests
npm run test:e2e

# Run visual tests separately
npm run test:visual
```

### Parallelize Carefully

Visual tests should run sequentially for consistency:

```typescript
// playwright-visual.config.ts
export default defineConfig({
  workers: 1, // Single worker for consistency
  fullyParallel: false,
});
```

## Examples

### Example 1: Full Page Screenshot

```typescript
test('homepage full page', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Example 2: Component with Masking

```typescript
test('dashboard with masked data', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [
      page.locator('.timestamp'),
      page.locator('.user-points'),
      page.locator('text=/\\d{1,2}:\\d{2}:/'),
    ],
  });
});
```

### Example 3: Multiple Viewports

```typescript
const viewports = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1920, height: 1080, name: 'desktop' },
];

viewports.forEach(({ width, height, name }) => {
  test(`homepage ${name} view`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot(`homepage-${name}.png`, {
      fullPage: true,
    });
  });
});
```

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices for Visual Testing](https://playwright.dev/docs/best-practices)
- [CI/CD Integration Guide](https://playwright.dev/docs/ci)

---

**Questions?** Check the [e2e/README.md](e2e/README.md) or Playwright documentation.
