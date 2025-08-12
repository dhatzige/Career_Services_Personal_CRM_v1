import { test, expect } from '@playwright/test';

const MASTER_CREDENTIALS = {
  email: 'dhatzige@act.edu',
  password: '!)DQeop4'
};

test.describe('Authentication Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if we're redirected to login
    await expect(page).toHaveURL(/\/login/);
    
    // Check for login form elements
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="••••"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should login with master account', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[placeholder*="email"]', MASTER_CREDENTIALS.email);
    await page.fill('input[placeholder*="••••"]', MASTER_CREDENTIALS.password);
    
    // Click login button
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[placeholder*="email"]', 'invalid@example.com');
    await page.fill('input[placeholder*="••••"]', 'wrongpassword');
    
    // Click login button
    await page.click('button:has-text("Sign In")');
    
    // Wait for error message
    await expect(page.locator('.text-red-600, .text-red-500, [role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[placeholder*="email"]', MASTER_CREDENTIALS.email);
    await page.fill('input[placeholder*="••••"]', MASTER_CREDENTIALS.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
    
    // Find and click logout button
    // Try different possible selectors
    const logoutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout"), button:has-text("Log out")').first();
    await logoutButton.click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});