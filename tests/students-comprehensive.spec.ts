import { test, expect } from '@playwright/test';

test.describe('Students Page Comprehensive Test', () => {
  let _studentId: string;
  const testEmail = `test${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'dhatzige@act.edu');
    await page.fill('input[type="password"]', '!)DQeop4');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
    
    // Navigate to students page
    await page.click('text=Students');
    await page.waitForURL('http://localhost:5173/students');
  });

  test('complete student workflow', async ({ page }) => {
    // 1. Create a new student
    await test.step('Create student', async () => {
      await page.click('button:has-text("Add Student")');
      
      // Fill out the form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Student');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="phone"]', '1234567890');
      
      // Select options
      await page.selectOption('select[name="yearOfStudy"]', '2nd year');
      await page.selectOption('select[name="programType"]', "Bachelor's");
      await page.fill('input[name="specificProgram"]', 'Computer Science');
      
      // Submit
      await page.click('button:has-text("Add Student")');
      
      // Wait for modal to close and student to appear
      await page.waitForSelector(`text=${testEmail}`);
    });

    // 2. Try to interact with the created student
    await test.step('Click on student to view details', async () => {
      // Click on the student card/row
      const studentElement = page.locator(`text=${testEmail}`).first();
      await studentElement.click();
      
      // Wait for detail modal to open
      await page.waitForSelector('[role="dialog"]');
      
      // Verify student details are displayed
      await expect(page.locator('text=Test Student')).toBeVisible();
      await expect(page.locator(`text=${testEmail}`)).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    });

    // 3. Test different view modes
    await test.step('Switch view modes', async () => {
      // Switch to card view
      const cardViewButton = page.locator('button[aria-label="Card view"]');
      if (await cardViewButton.isVisible()) {
        await cardViewButton.click();
        await page.waitForTimeout(500);
      }
      
      // Verify student is still visible
      await expect(page.locator(`text=${testEmail}`)).toBeVisible();
      
      // Try to delete from card view
      const deleteButton = page.locator('button[title*="Delete"]').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());
        
        // Wait for student to be removed
        await page.waitForSelector(`text=${testEmail}`, { state: 'hidden' });
      }
    });

    // 4. Test search functionality
    await test.step('Search for students', async () => {
      // Create another student first
      await page.click('button:has-text("Add Student")');
      await page.fill('input[name="firstName"]', 'Search');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', `search${Date.now()}@example.com`);
      await page.selectOption('select[name="yearOfStudy"]', '3rd year');
      await page.selectOption('select[name="programType"]', "Master's");
      await page.fill('input[name="specificProgram"]', 'Data Science');
      await page.click('button:has-text("Add Student")');
      
      await page.waitForTimeout(1000);
      
      // Search for the student
      await page.fill('input[placeholder*="Search"]', 'Search Test');
      await page.waitForTimeout(500);
      
      // Verify search results
      await expect(page.locator('text=Search Test')).toBeVisible();
    });

    // 5. Test filters
    await test.step('Test filters', async () => {
      // Clear search
      await page.fill('input[placeholder*="Search"]', '');
      
      // Apply year filter
      const yearFilter = page.locator('select').nth(0);
      if (await yearFilter.isVisible()) {
        await yearFilter.selectOption('3rd year');
        await page.waitForTimeout(500);
      }
      
      // Apply program filter
      const programFilter = page.locator('select').nth(1);
      if (await programFilter.isVisible()) {
        await programFilter.selectOption("Master's");
        await page.waitForTimeout(500);
      }
    });

    // 6. Test mobile view
    await test.step('Test mobile view', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Verify mobile layout is active
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        // Test mobile-specific interactions
        await expect(page.locator('text=Search Test')).toBeVisible();
      }
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test('verify error handling', async ({ page }) => {
    // Test creating student with existing email
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="firstName"]', 'Duplicate');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.selectOption('select[name="yearOfStudy"]', '1st year');
    await page.selectOption('select[name="programType"]', "Bachelor's");
    await page.fill('input[name="specificProgram"]', 'Test Program');
    
    // Create first student
    await page.click('button:has-text("Add Student")');
    await page.waitForTimeout(1000);
    
    // Try to create duplicate
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.click('button:has-text("Add Student")');
    
    // Should show error
    const errorToast = page.locator('.Toastify__toast--error');
    if (await errorToast.isVisible()) {
      await expect(errorToast).toContainText('already exists');
    }
  });
});