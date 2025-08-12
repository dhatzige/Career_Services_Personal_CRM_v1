import { test, expect } from '@playwright/test';

test.describe('Debug Login', () => {
  test('Debug Supabase login step by step', async ({ page, request }) => {
    // Enable detailed console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('auth')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('auth')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Page loaded, checking for form elements...');
    const emailInput = await page.locator('input[placeholder*="example.com"]');
    const passwordInput = await page.locator('input[type="password"]');
    const signInButton = await page.locator('button:has-text("Sign In")');
    
    console.log('Form elements found:', {
      email: await emailInput.isVisible(),
      password: await passwordInput.isVisible(),
      button: await signInButton.isVisible()
    });
    
    console.log('3. Filling in credentials...');
    await emailInput.fill('dhatzige@act.edu');
    await passwordInput.fill('!)DQeop4');
    
    console.log('4. Taking screenshot before login...');
    await page.screenshot({ path: 'debug-before-login.png' });
    
    console.log('5. Clicking Sign In button...');
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('auth') || response.url().includes('token'),
      { timeout: 10000 }
    ).catch(() => null);
    
    await signInButton.click();
    
    console.log('6. Waiting for auth response...');
    const authResponse = await responsePromise;
    if (authResponse) {
      console.log('Auth response:', authResponse.status(), authResponse.url());
      const responseBody = await authResponse.text();
      console.log('Response preview:', responseBody.substring(0, 200));
    } else {
      console.log('No auth response detected within timeout');
    }
    
    console.log('7. Waiting 3 seconds for any navigation...');
    await page.waitForTimeout(3000);
    
    console.log('8. Current URL:', page.url());
    await page.screenshot({ path: 'debug-after-login.png' });
    
    // Check for error messages
    const errors = await page.locator('.error, .text-red-500, [role="alert"]').allTextContents();
    if (errors.length > 0) {
      console.log('Error messages found:', errors);
    }
    
    // Check page content
    const bodyText = await page.textContent('body');
    console.log('Page content preview:', bodyText.substring(0, 300));
    
    // Final verdict
    if (page.url().includes('dashboard')) {
      console.log('✅ SUCCESS: Redirected to dashboard');
    } else {
      console.log('❌ FAILED: Still on login page');
      
      // Check localStorage for any auth data
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.includes('auth') || key.includes('supabase'))) {
            items[key] = window.localStorage.getItem(key);
          }
        }
        return items;
      });
      console.log('Auth-related localStorage:', localStorage);
    }
  });
});