import { test, expect } from '@playwright/test';

test.describe('Check Supabase Auth', () => {
  test('Check if login page loads with Supabase', async ({ page }) => {
    console.log('1. Going to login page...');
    await page.goto('http://localhost:5173/login');
    
    console.log('2. Waiting for load...');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for any errors in console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Check page content
    const content = await page.textContent('body');
    console.log('3. Page loaded. Content preview:', content.substring(0, 200));
    
    // Take screenshot
    await page.screenshot({ path: 'supabase-login-page.png' });
    
    // Check if we see any error messages
    const errors = await page.locator('.error, .text-red-500, [role="alert"]').allTextContents();
    if (errors.length > 0) {
      console.log('Error messages on page:', errors);
    }
    
    // Check for the login form
    const hasEmailInput = await page.locator('input[type="text"], input[type="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
    const hasSubmitButton = await page.locator('button:has-text("Sign In")').count() > 0;
    
    console.log('Login form elements:', {
      hasEmailInput,
      hasPasswordInput,
      hasSubmitButton
    });
    
    expect(hasEmailInput).toBe(true);
    expect(hasPasswordInput).toBe(true);
    expect(hasSubmitButton).toBe(true);
  });
});