import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate from Dashboard to Students page', async ({ page }) => {
    // Go to the dashboard
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('text=Dashboard');
    
    // Click the "Add Your First Student" button
    await page.click('text=Add Your First Student');
    
    // Wait for navigation
    await page.waitForURL('**/students');
    
    // Verify we're on the students page
    await expect(page.locator('h1')).toContainText('Students');
  });

  test('should display dashboard correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if dashboard elements are present
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=No students yet')).toBeVisible();
    await expect(page.locator('button:has-text("Add Your First Student")')).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links
    const navLinks = [
      { text: 'Students', url: '/students' },
      { text: 'Calendar', url: '/calendar' },
      { text: 'Integrations', url: '/integrations' },
      { text: 'Settings', url: '/settings' }
    ];
    
    for (const link of navLinks) {
      await page.click(`text=${link.text}`);
      await page.waitForURL(`**${link.url}`);
      await expect(page.url()).toContain(link.url);
    }
  });
});