import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('Login with existing master account', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Try to login with master credentials
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'dhatzige@act.edu');
    await page.fill('input[type="password"]', 'MasterPass123!');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check for error messages
    const errorMessage = page.locator('.text-red-600, .error-message, [role="alert"]');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log('Login error:', errorText);
      
      // If invalid credentials, the account might not exist
      if (errorText?.includes('Invalid') || errorText?.includes('credentials')) {
        console.log('Master account may not exist in Supabase');
      }
    } else if (currentUrl.includes('dashboard') || currentUrl.includes('students')) {
      console.log('✅ Login successful!');
      
      // Check user info
      const userMenu = page.locator('button[aria-label="User menu"], .user-menu');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        const userEmail = page.locator('text=dhatzige@act.edu');
        await expect(userEmail).toBeVisible();
      }
    }
  });
});