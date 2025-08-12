import { test, expect } from '@playwright/test';

test.describe('Verify All Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('Calendar page has proper heading', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/calendar/);
    
    // Calendar page has "Calendar & Scheduling" as heading
    await expect(page.locator('h1:has-text("Calendar & Scheduling")')).toBeVisible();
  });

  test('User menu shows email and can sign out', async ({ page }) => {
    // Click user avatar (should show first letter of email)
    const userButton = page.locator('button[aria-label="User menu"]');
    await expect(userButton).toBeVisible();
    
    // Check avatar shows 'D' for dhatzige@act.edu
    await expect(userButton.locator('div').filter({ hasText: 'D' })).toBeVisible();
    
    // Click to open menu
    await userButton.click();
    
    // Check email is displayed in dropdown
    await expect(page.locator('text=dhatzige@act.edu')).toBeVisible();
    
    // Sign out button exists
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
    
    // Click sign out
    await page.locator('button:has-text("Sign out")').click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('No duplicate auth files causing issues', async ({ page }) => {
    // Navigate through all sections to ensure no import errors
    const sections = ['Students', 'Calendar', 'Career Services', 'Settings'];
    
    for (const section of sections) {
      await page.getByRole('link', { name: section, exact: true }).first().click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check no error messages
      const errors = await page.locator('.error, .text-red-500').count();
      expect(errors).toBe(0);
    }
    
    // Return to dashboard
    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

test('Full CRM smoke test', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
  await page.locator('input[type="password"]').fill('!)DQeop4');
  await page.locator('button:has-text("Sign In")').click();
  await expect(page).toHaveURL('http://localhost:5173/');
  
  // Quick navigation test
  await page.getByRole('link', { name: 'Students', exact: true }).first().click();
  await expect(page.locator('h1').last()).toContainText('Students');
  
  await page.getByRole('link', { name: 'Calendar', exact: true }).first().click();
  await expect(page.locator('h1')).toContainText('Calendar & Scheduling');
  
  // User menu test
  await page.locator('button[aria-label="User menu"]').click();
  await expect(page.locator('text=dhatzige@act.edu')).toBeVisible();
  
  // Click outside to close menu
  await page.click('body', { position: { x: 100, y: 100 } });
  
  // Take final screenshot
  await page.screenshot({ path: 'crm-fixes-verified.png', fullPage: true });
  
  console.log('✅ All fixes verified successfully!');
});