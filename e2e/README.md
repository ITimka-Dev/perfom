# E2E Testing with Playwright

This directory contains end-to-end tests for the EduFarm application.

## Test Types

### Functional Tests (`*.spec.ts`)
Standard E2E tests that verify functionality:
- Authentication flows
- Task creation and submission
- Farm interactions
- Navigation and routing

### Visual Regression Tests (`visual/*.spec.ts`)
Screenshot-based tests that detect UI changes:
- Homepage layout
- Dashboard views
- Farm zone displays
- Component rendering

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run visual regression tests
```bash
npx playwright test --config=playwright-visual.config.ts
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run in debug mode
```bash
npx playwright test --debug
```

## Visual Regression Testing

### First Time Setup

1. **Generate baseline screenshots:**
```bash
npx playwright test --config=playwright-visual.config.ts --update-snapshots
```

This creates reference screenshots in `e2e/visual/*.spec.ts-snapshots/`.

2. **Commit baselines to Git:**
```bash
git add e2e/visual/*.spec.ts-snapshots/
git commit -m "Add visual regression baselines"
```

### Running Visual Tests

```bash
npx playwright test --config=playwright-visual.config.ts
```

### Updating Baselines

When you intentionally change the UI:

```bash
npx playwright test --config=playwright-visual.config.ts --update-snapshots
```

Or update specific test:
```bash
npx playwright test e2e/visual/homepage.spec.ts --update-snapshots
```

### Reviewing Differences

When tests fail:
1. Check the HTML report: `npx playwright show-report playwright-report/visual`
2. Review diff images in `test-results/`
3. Decide if changes are intentional:
   - Yes → Update baselines
   - No → Fix the bug

## Best Practices

### Writing Functional Tests

✅ **DO:**
- Use data-testid attributes for reliable selectors
- Wait for network idle before assertions
- Test user flows, not implementation details
- Use page object pattern for complex pages

❌ **DON'T:**
- Rely on text content that might change
- Use brittle CSS selectors
- Test internal state directly
- Hardcode wait times (use `waitFor*` methods)

### Writing Visual Tests

✅ **DO:**
- Disable animations: `animations: 'disabled'`
- Mask dynamic content (times, dates, counters)
- Use consistent viewport sizes
- Wait for network idle before screenshots
- Test both desktop and mobile views

❌ **DON'T:**
- Include timestamps in screenshots
- Take screenshots during animations
- Use inconsistent viewport sizes
- Include user-specific data

### Example: Masking Dynamic Content

```typescript
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('text=/\\d{1,2}:\\d{2}/'), // Mask times
    page.locator('[data-testid="user-points"]'), // Mask dynamic numbers
  ],
});
```

## CI/CD Integration

Visual regression tests run automatically in GitHub Actions on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

Failed visual tests will block the pipeline. Review and either:
1. Fix the unintended change
2. Update baselines if change is intentional

## Debugging Failed Tests

### View test results
```bash
npx playwright show-report
```

### Run specific test with video
```bash
npx playwright test e2e/auth.spec.ts --video=on
```

### Trace viewer (most powerful)
```bash
npx playwright test --trace=on
npx playwright show-trace trace.zip
```

## Test Data

Tests use these default accounts:
- **Student:** `student@example.com` / `password123`
- **Teacher:** `teacher@example.com` / `password123`

Make sure these exist in your test database.

## Folder Structure

```
e2e/
├── auth.spec.ts                 # Authentication tests
├── task-creation.spec.ts        # Task creation tests
├── farm-interactions.spec.ts    # Farm feature tests
├── visual/                      # Visual regression tests
│   ├── homepage.spec.ts
│   ├── dashboard.spec.ts
│   └── farm.spec.ts
└── README.md                    # This file
```

## Troubleshooting

### Tests fail with "Timeout"
- Increase timeout in test or globally
- Check if dev server is running
- Verify network conditions

### Visual tests fail with minor differences
- Check if fonts loaded correctly
- Verify viewport size is consistent
- Disable animations properly
- Adjust `maxDiffPixelRatio` if needed

### "Element not found" errors
- Use better selectors (data-testid)
- Add proper waits
- Check if element is conditionally rendered

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
