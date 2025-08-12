import { test, expect } from '@playwright/test';

test.describe('Calendar and Scheduling', () => {
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

  test('should navigate to calendar page', async ({ page }) => {
    await page.click('text=Calendar');
    await expect(page).toHaveURL('/calendar');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Calendar');
  });

  test('should display calendar view', async ({ page }) => {
    await page.goto('/calendar');
    
    // Check for calendar elements
    await expect(page.locator('text=Upcoming Meetings')).toBeVisible();
    
    // Should show empty state initially
    await expect(page.locator('text=No upcoming meetings')).toBeVisible();
  });

  test('should switch between calendar tabs', async ({ page }) => {
    await page.goto('/calendar');
    
    // Check upcoming tab
    await page.click('text=Upcoming');
    await expect(page.locator('text=No upcoming meetings')).toBeVisible();
    
    // Switch to schedule tab
    await page.click('text=Schedule');
    // Should show Calendly integration or scheduling interface
    await expect(page.locator('text=Schedule')).toBeVisible();
  });

  test('should check Calendly integration status', async ({ page }) => {
    await page.goto('/calendar');
    
    // Look for Calendly integration elements
    const calendlySection = page.locator('text=Calendly');
    if (await calendlySection.count() > 0) {
      await expect(calendlySection).toBeVisible();
    }
  });
});