import { test, expect } from '@playwright/test';

test.describe('Settings and Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Setup auth and login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/login');
    await page.fill('input[placeholder="Enter a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Set Up Authentication")');
    await page.fill('input[placeholder="Enter your master password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign in")');
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should display all settings sections', async ({ page }) => {
    await page.goto('/settings');
    
    // Check for main settings sections
    await expect(page.locator('text=Account Settings')).toBeVisible();
    await expect(page.locator('text=Backup & Restore')).toBeVisible();
    await expect(page.locator('text=Integrations')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.goto('/settings');
    
    // Click change password
    await page.click('button:has-text("Change Password")');
    
    // Fill password change form
    await page.fill('input[placeholder*="Current password"]', 'TestPassword123!');
    await page.fill('input[placeholder*="New password"]', 'NewPassword123!');
    await page.fill('input[placeholder*="Confirm new password"]', 'NewPassword123!');
    
    await page.click('button:has-text("Update Password")');
    
    // Verify success message
    await expect(page.locator('text=Password updated successfully')).toBeVisible();
  });

  test('should export data', async ({ page }) => {
    await page.goto('/settings');
    
    // Navigate to backup section
    await page.click('text=Backup & Restore');
    
    // Test export functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Data")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Click dark mode toggle
    await page.click('button[aria-label="Switch to dark mode"]');
    
    // Check if dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Toggle back
    await page.click('button[aria-label="Switch to light mode"]');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('should configure Calendly integration', async ({ page }) => {
    await page.goto('/settings');
    
    // Navigate to integrations
    await page.click('text=Integrations');
    
    // Look for Calendly section
    await expect(page.locator('text=Calendly')).toBeVisible();
    
    // Test API key input
    await page.fill('input[placeholder*="API key"]', 'test-api-key');
    await page.click('button:has-text("Save")');
    
    // Verify save confirmation
    await expect(page.locator('text=saved')).toBeVisible();
  });
});