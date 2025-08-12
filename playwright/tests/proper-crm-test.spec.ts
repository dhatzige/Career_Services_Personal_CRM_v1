import { test, expect } from '@playwright/test';

test.describe('CRM E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for navigation and dashboard to load
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('navigate to all main sections', async ({ page }) => {
    // Students
    await page.getByRole('link', { name: 'Students', exact: true }).click();
    await expect(page).toHaveURL(/.*\/students/);
    await expect(page.locator('h1')).toContainText('Students');
    
    // Calendar
    await page.getByRole('link', { name: 'Calendar', exact: true }).click();
    await expect(page).toHaveURL(/.*\/calendar/);
    await expect(page.locator('h1')).toContainText('Calendar');
    
    // Career Services
    await page.getByRole('link', { name: 'Career Services', exact: true }).click();
    await expect(page).toHaveURL(/.*\/career/);
    
    // Settings
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Back to Dashboard
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('add a student', async ({ page }) => {
    // Go to students page
    await page.getByRole('link', { name: 'Students', exact: true }).click();
    await expect(page).toHaveURL(/.*\/students/);
    
    // Click add student button
    const addButton = page.getByRole('button', { name: /add.*student/i });
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Wait for modal/form
    await page.waitForTimeout(500);
    
    // Fill form if visible
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible({ timeout: 2000 })) {
      await firstNameInput.fill('Test');
      await page.locator('input[name="lastName"]').fill('Student');
      await page.locator('input[name="email"]').fill('test@example.com');
      await page.locator('input[name="phone"]').fill('555-0123');
      
      // Save
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(1000);
      
      // Verify student was added
      await expect(page.locator('text=Test Student')).toBeVisible({ timeout: 5000 });
    }
  });

  test('search functionality', async ({ page }) => {
    await page.getByRole('link', { name: 'Students', exact: true }).click();
    
    const searchBox = page.getByPlaceholder(/search/i);
    await expect(searchBox).toBeVisible();
    await searchBox.fill('test search');
    await page.waitForTimeout(500);
  });

  test('user menu and logout', async ({ page }) => {
    // Open user menu
    const userMenuButton = page.getByRole('button', { name: 'User menu' });
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();
    
    // Check email is visible
    await expect(page.locator('text=dhatzige@act.edu')).toBeVisible();
    
    // Logout
    await page.getByText('Sign out').click();
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });
});

test('full e2e flow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
  await page.locator('input[type="password"]').fill('!)DQeop4');
  await page.locator('button:has-text("Sign In")').click();
  await expect(page).toHaveURL('http://localhost:5173/');
  
  // Navigate and test each section
  const sections = ['Students', 'Calendar', 'Career Services', 'Settings'];
  
  for (const section of sections) {
    await page.getByRole('link', { name: section, exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  
  // Return to dashboard
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  
  // Take screenshot
  await page.screenshot({ path: 'crm-test-success.png', fullPage: true });
});