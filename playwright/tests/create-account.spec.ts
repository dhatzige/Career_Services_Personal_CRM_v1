import { test, expect } from '@playwright/test';

test.describe('Account Creation', () => {
  test('Check if signup is available', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Look for sign up option
    const signUpTab = page.locator('button:has-text("Sign Up"), a:has-text("Sign Up")');
    
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
      console.log('✅ Sign up tab is available');
      
      // Check if we can see the signup form
      const usernameField = page.locator('input[placeholder*="username" i]');
      if (await usernameField.isVisible()) {
        console.log('✅ Signup form is visible');
        
        // Try to create a test account
        await usernameField.fill('testuser123');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.fill('input[placeholder*="confirm" i]', 'TestPass123!');
        
        // Try to submit
        await page.click('button:has-text("Sign Up"), button:has-text("Create Account")');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for messages
        const successMessage = page.locator('text=/check your email|account created|verify/i');
        const errorMessage = page.locator('.text-red-600, .error-message, [role="alert"]');
        
        if (await successMessage.isVisible()) {
          console.log('✅ Account creation successful:', await successMessage.textContent());
        } else if (await errorMessage.isVisible()) {
          console.log('❌ Account creation error:', await errorMessage.textContent());
        }
      }
    } else {
      console.log('❌ Sign up is not available (invite-only system)');
    }
  });
  
  test('Try legacy authentication', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Try with username instead of email
    await page.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('students')) {
      console.log('✅ Legacy login successful!');
    } else {
      console.log('❌ Legacy login failed');
      
      // Try setup account
      const response = await page.request.post('http://localhost:4001/api/auth/setup', {
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123'
        }
      });
      
      if (response.ok()) {
        console.log('✅ Admin account created via API');
        const data = await response.json();
        console.log('Response:', data);
      } else {
        console.log('❌ Failed to create admin account:', response.status(), await response.text());
      }
    }
  });
});