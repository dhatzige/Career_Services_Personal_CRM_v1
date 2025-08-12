import { test, expect } from '@playwright/test';

test.describe('UI Interactions and Features', () => {
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

  test('should use keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard shortcut for help (?)
    await page.keyboard.press('Shift+?');
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Keyboard Shortcuts')).not.toBeVisible();
  });

  test('should open quick note modal', async ({ page }) => {
    await page.goto('/');
    
    // Click quick note button
    await page.click('button[aria-label="Open quick note modal"]');
    
    // Check modal is open
    await expect(page.locator('text=Quick Note')).toBeVisible();
    
    // Add a note
    await page.fill('textarea[placeholder*="Type your note"]', 'Test quick note');
    await page.click('button:has-text("Save Note")');
    
    // Verify note saved
    await expect(page.locator('text=Note saved')).toBeVisible();
  });

  test('should use AI assistant', async ({ page }) => {
    await page.goto('/');
    
    // Click AI assistant button
    await page.click('button[aria-label="Open AI Career Assistant"]');
    
    // Check AI assistant opens
    await expect(page.locator('text=AI Career Assistant')).toBeVisible();
    
    // Type a question
    await page.fill('textarea[placeholder*="Ask me anything"]', 'How do I write a good resume?');
    await page.click('button:has-text("Send")');
    
    // Should show loading or response
    await expect(page.locator('text=Thinking')).toBeVisible();
  });

  test('should use tags manager', async ({ page }) => {
    await page.goto('/');
    
    // Click tags manager button
    await page.click('button[aria-label="Open tags manager"]');
    
    // Check tags manager opens
    await expect(page.locator('text=Tags Manager')).toBeVisible();
    
    // Add a new tag
    await page.fill('input[placeholder*="New tag"]', 'Important');
    await page.click('button:has-text("Add Tag")');
    
    // Verify tag appears
    await expect(page.locator('text=Important')).toBeVisible();
  });

  test('should display recent students in sidebar', async ({ page }) => {
    // First add a student
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Recent Student');
    await page.fill('input[name="email"]', 'recent@example.com');
    await page.click('button:has-text("Save")');
    
    // Go back to dashboard
    await page.goto('/');
    
    // Check sidebar for recent student
    await expect(page.locator('nav').locator('text=Recent Student')).toBeVisible();
  });

  test('should show offline indicator when offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    await page.goto('/');
    
    // Should show offline indicator
    await expect(page.locator('text=Offline')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    await page.reload();
    
    // Offline indicator should disappear
    await expect(page.locator('text=Offline')).not.toBeVisible();
  });

  test('should handle responsive navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Menu should be collapsed
    await expect(page.locator('nav.sidebar')).not.toBeVisible();
    
    // Click menu button
    await page.click('button[aria-label="Toggle menu"]');
    
    // Menu should be visible
    await expect(page.locator('nav.sidebar')).toBeVisible();
  });

  test('should show tooltips on hover', async ({ page }) => {
    await page.goto('/');
    
    // Hover over help button
    await page.hover('button[aria-label="Open help documentation"]');
    
    // Tooltip should appear
    await expect(page.locator('text=Help')).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    
    // Try to save without required fields
    await page.click('button:has-text("Save")');
    
    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should auto-save draft data', async ({ page }) => {
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    
    // Start filling form
    await page.fill('input[name="name"]', 'Auto Save Test');
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    
    // Open add student modal again
    await page.click('button:has-text("Add Student")');
    
    // Check if draft data is restored
    await expect(page.locator('input[name="name"]')).toHaveValue('Auto Save Test');
  });
});