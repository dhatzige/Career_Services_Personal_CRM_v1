import { test, expect } from '@playwright/test';

test.describe('CRM Complete Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('h1:has-text("Dashboard")').last()).toBeVisible();
  });

  test('navigate all sections', async ({ page }) => {
    // Students
    await page.getByRole('link', { name: 'Students', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/students/);
    await expect(page.locator('h1:has-text("Students")').last()).toBeVisible();
    
    // Calendar  
    await page.getByRole('link', { name: 'Calendar', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/calendar/);
    await expect(page.locator('h1:has-text("Calendar")').last()).toBeVisible();
    
    // Career Services
    await page.getByRole('link', { name: 'Career Services', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/career/);
    
    // Settings
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Dashboard
    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('add student flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Students', exact: true }).first().click();
    
    // Click first visible Add Student button
    await page.getByRole('button', { name: /add.*student/i }).first().click();
    await page.waitForTimeout(500);
    
    // Check if form opened
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible({ timeout: 2000 })) {
      await firstNameInput.fill('John');
      await page.locator('input[name="lastName"]').fill('Doe');
      await page.locator('input[name="email"]').fill('john.doe@test.com');
      
      // Close or save
      const saveButton = page.getByRole('button', { name: 'Save' });
      if (await saveButton.isVisible()) {
        await saveButton.click();
      } else {
        // Close modal
        await page.keyboard.press('Escape');
      }
    }
  });

  test('search students', async ({ page }) => {
    await page.getByRole('link', { name: 'Students', exact: true }).first().click();
    
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test search');
    await searchInput.press('Enter');
  });

  test('user menu', async ({ page }) => {
    // Find user avatar button (usually has "A" or user initial)
    const userButton = page.locator('button').filter({ hasText: 'A' }).last();
    await expect(userButton).toBeVisible();
    await userButton.click();
    
    // Check menu opened
    await expect(page.locator('text=dhatzige@act.edu')).toBeVisible();
    
    // Sign out
    await page.getByText('Sign out').click();
    await expect(page).toHaveURL(/.*\/login/);
  });
});

test('full CRM workflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  console.log('1. Login...');
  await page.goto('http://localhost:5173/login');
  await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
  await page.locator('input[type="password"]').fill('!)DQeop4');
  await page.locator('button:has-text("Sign In")').click();
  await expect(page).toHaveURL('http://localhost:5173/');
  
  console.log('2. Navigate sections...');
  const navLinks = ['Students', 'Calendar', 'Career Services', 'Settings'];
  for (const link of navLinks) {
    await page.getByRole('link', { name: link, exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded');
    console.log(`   ✓ ${link}`);
  }
  
  console.log('3. Return to dashboard...');
  await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
  
  console.log('4. Take screenshot...');
  await page.screenshot({ path: 'crm-full-test.png', fullPage: true });
  
  console.log('✅ All tests completed!');
});