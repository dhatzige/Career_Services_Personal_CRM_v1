import { test, expect } from '@playwright/test';

const MASTER_CREDENTIALS = {
  email: 'dhatzige@act.edu',
  password: '!)DQeop4'
};

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('should load login page', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Check if we're redirected to login
    await expect(page).toHaveURL(/\/login/);
    
    // Check for login form elements using actual selectors from the page
    const emailInput = page.locator('input[placeholder*="email"]');
    const passwordInput = page.locator('input[placeholder*="••••"]');
    const signInButton = page.locator('button:has-text("Sign In")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
  });

  test('should attempt login with master account', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    
    // Fill in credentials
    await page.locator('input[placeholder*="email"]').fill(MASTER_CREDENTIALS.email);
    await page.locator('input[placeholder*="••••"]').fill(MASTER_CREDENTIALS.password);
    
    // Click login button and wait for response
    const signInButton = page.locator('button:has-text("Sign In")');
    
    // Listen for network requests to debug auth issues
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`Auth response: ${response.url()} - ${response.status()}`);
      }
    });
    
    await signInButton.click();
    
    // Wait for either navigation or error message
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {}),
      page.locator('.text-red-600, .text-red-500, [role="alert"]').waitFor({ timeout: 5000 }).catch(() => {})
    ]);
    
    // Check current state
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-attempt.png' });
    
    // If we're still on login page, check for error
    if (currentUrl.includes('/login')) {
      const errorVisible = await page.locator('.text-red-600, .text-red-500').isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await page.locator('.text-red-600, .text-red-500').textContent();
        console.log('Login error:', errorText);
      }
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    
    // Fill in invalid credentials  
    await page.locator('input[placeholder*="email"]').fill('invalid@example.com');
    await page.locator('input[placeholder*="••••"]').fill('wrongpassword');
    
    // Click login button
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for error message
    const errorElement = page.locator('.text-red-600, .text-red-500, [role="alert"]');
    await expect(errorElement).toBeVisible({ timeout: 10000 });
    
    // Verify we're still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should prevent signup when disabled', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    
    // Click on Sign Up tab
    await page.locator('button:has-text("Sign Up")').click();
    
    // Fill in signup form
    await page.locator('input[placeholder="johndoe"]').fill('testuser');
    await page.locator('input[placeholder="email@example.com"]').fill('test@example.com');
    await page.locator('input[placeholder="••••••••"]').first().fill('TestPassword123!');
    await page.locator('input[placeholder="••••••••"]').last().fill('TestPassword123!');
    
    // Try to create account
    await page.locator('button:has-text("Create Account")').click();
    
    // Should show error since public signups are disabled
    const errorElement = page.locator('.text-red-600, .text-red-500, [role="alert"]');
    await expect(errorElement).toBeVisible({ timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'signup-disabled.png' });
  });
});