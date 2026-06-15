import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // Wait for the page to load
  await page.goto('http://localhost:5173');

  // Expect the title to contain a substring.
  await expect(page).toHaveTitle(/Vite \+ React/);
});
