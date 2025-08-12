import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all localStorage/sessionStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should show password setup page for first-time users', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Should show password setup
    await expect(page.locator('h2')).toContainText('Set up your master password');
    await expect(page.locator('text=Create a secure password')).toBeVisible();
  });

  test('should set up password successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Enter password
    await page.fill('input[placeholder="Enter a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    
    // Click setup button
    await page.click('button:has-text("Set Up Authentication")');
    
    // Should show login page
    await expect(page.locator('h2')).toContainText('Sign in to your CRM');
  });

  test('should login successfully with correct password', async ({ page }) => {
    // First set up password
    await page.goto('/login');
    await page.fill('input[placeholder="Enter a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Set Up Authentication")');
    
    // Now login
    await page.fill('input[placeholder="Enter your master password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign in")');
    
    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for incorrect password', async ({ page }) => {
    // Set up password first
    await page.goto('/login');
    await page.fill('input[placeholder="Enter a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Set Up Authentication")');
    
    // Try to login with wrong password
    await page.fill('input[placeholder="Enter your master password"]', 'WrongPassword');
    await page.click('button:has-text("Sign in")');
    
    // Should show error
    await expect(page.locator('text=Invalid password')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[placeholder="Enter a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Set Up Authentication")');
    await page.fill('input[placeholder="Enter your master password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign in")');
    
    // Click logout
    await page.click('button[aria-label="Sign out of your account"]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should persist session with "Stay logged in" option', async ({ page }) => {
    // Setup and login with stay logged in
    await page.goto('/login');
    await page.fill('input[placeholder="Enter a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Set Up Authentication")');
    
    await page.fill('input[placeholder="Enter your master password"]', 'TestPassword123!');
    await page.check('input[type="checkbox"]'); // Check "Stay logged in"
    await page.click('button:has-text("Sign in")');
    
    // Navigate away and come back
    await page.goto('about:blank');
    await page.goto('/');
    
    // Should still be logged in
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});