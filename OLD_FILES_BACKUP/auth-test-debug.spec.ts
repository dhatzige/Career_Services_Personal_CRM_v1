import { test, expect } from '@playwright/test';

test.describe('Authentication Debug Test', () => {
  test('Debug login process', async ({ page }) => {
    // Navigate to the login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('2. Page loaded');
    
    // Take screenshot before login
    await page.screenshot({ path: 'before-login.png' });
    
    // Fill in login form
    console.log('3. Filling in form...');
    const emailInput = page.locator('input[type="text"][placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('dhatzige@act.edu');
    await passwordInput.fill('!)DQeop4');
    console.log('4. Form filled');
    
    // Take screenshot after filling
    await page.screenshot({ path: 'after-fill.png' });
    
    // Click sign in button
    console.log('5. Clicking Sign In button...');
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for response with timeout
    console.log('6. Waiting for response...');
    
    // Wait for either navigation or error message
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.waitForURL('**/students', { timeout: 10000 }),
      page.waitForSelector('.error, .alert, [role="alert"], .text-red-500', { timeout: 10000 }),
      page.waitForTimeout(10000)
    ]).catch(e => console.log('Wait completed or timed out'));
    
    // Check current state
    const url = page.url();
    console.log('7. Current URL:', url);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png' });
    
    // Check for error messages
    const errorMessages = await page.locator('.error, .alert, [role="alert"], .text-red-500').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Check page content
    const pageContent = await page.textContent('body');
    console.log('8. Page content includes:', pageContent.substring(0, 200) + '...');
    
    // Final assertion
    if (url.includes('dashboard') || url.includes('students')) {
      console.log('✅ Login successful!');
      expect(true).toBe(true);
    } else {
      console.log('❌ Login failed or redirected to:', url);
      expect(url).toContain('dashboard');
    }
  });
});