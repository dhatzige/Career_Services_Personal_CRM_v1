import { test, expect } from '@playwright/test';

test.describe('Test Supabase Login', () => {
  test('Login with master account', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      console.log(`Console ${msg.type()}:`, msg.text());
    });
    
    // Listen for page errors
    page.on('pageerror', err => {
      console.log('Page error:', err.message);
    });
    
    console.log('1. Going to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Filling in credentials...');
    // Find and fill email
    await page.locator('input[type="text"][placeholder*="email"]').fill('dhatzige@act.edu');
    
    // Find and fill password
    await page.locator('input[type="password"]').fill('!)DQeop4');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-login-click.png' });
    
    console.log('3. Clicking Sign In...');
    // Click the Sign In button
    const signInButton = page.locator('button:has-text("Sign In")');
    await signInButton.click();
    
    console.log('4. Waiting for response...');
    // Wait for either navigation or error
    try {
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 5000 }),
        page.waitForURL('**/students', { timeout: 5000 }),
        page.waitForSelector('.error, .text-red-500, [role="alert"]', { timeout: 5000 })
      ]);
    } catch (e) {
      console.log('Timeout waiting for navigation or error');
    }
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'after-login-click.png' });
    
    const currentUrl = page.url();
    console.log('5. Current URL:', currentUrl);
    
    // Check for errors
    const errorElements = await page.locator('.error, .text-red-500, [role="alert"]').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text) {
        console.log('Error found:', text);
      }
    }
    
    // Final check
    if (currentUrl.includes('dashboard') || currentUrl.includes('students')) {
      console.log('✅ Login successful!');
      expect(true).toBe(true);
    } else {
      const pageContent = await page.textContent('body');
      console.log('Page content:', pageContent.substring(0, 300));
      throw new Error('Login failed - still on login page');
    }
  });
});