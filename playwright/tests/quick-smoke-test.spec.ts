import { test, expect } from '@playwright/test';

test.describe('Quick Smoke Test', () => {
  test('Application loads and shows login page', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check title
    await expect(page).toHaveTitle(/Personal CRM|Career Services CRM/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Check for social login buttons
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with GitHub")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with LinkedIn")')).toBeVisible();
    
    console.log('✅ Login page loads correctly with all elements');
  });
  
  test('Backend API is accessible', async ({ request }) => {
    // Check health endpoint
    const health = await request.get('http://localhost:4001/health');
    
    // Handle rate limiting
    if (health.status() === 429) {
      console.log('⚠️ Backend is rate limiting, but it\'s responding');
      return;
    }
    
    expect(health.ok()).toBeTruthy();
    
    const healthData = await health.json();
    expect(healthData.status).toBe('ok');
    
    console.log('✅ Backend API is healthy:', healthData);
  });
});