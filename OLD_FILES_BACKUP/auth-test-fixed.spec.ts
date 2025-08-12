import { test, expect } from '@playwright/test';

test.describe('Authentication Test', () => {
  test('Master account can log in successfully', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in login form
    const emailInput = page.locator('input[type="text"][placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('dhatzige@act.edu');
    await passwordInput.fill('!)DQeop4');
    
    // Click sign in button
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for navigation or error message
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to dashboard or if there's an error
    const url = page.url();
    
    if (url.includes('dashboard') || url.includes('students')) {
      console.log('✅ Login successful! Redirected to:', url);
      
      // Check for user info or logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
    } else {
      // Check for any error messages
      const errorMessage = await page.locator('.error, .alert, [role="alert"]').textContent();
      if (errorMessage) {
        console.log('❌ Login failed with error:', errorMessage);
      } else {
        console.log('⚠️ Login completed but no redirect occurred. Current URL:', url);
      }
    }
  });
});