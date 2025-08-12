import { test, expect } from '@playwright/test';

test('basic navigation test', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5174');
  
  // Should redirect to login
  await expect(page).toHaveURL(/\/login/);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'login-page.png' });
  
  // Check page title
  await expect(page).toHaveTitle(/Career Services CRM|Personal CRM/);
});