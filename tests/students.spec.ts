import { test, expect } from '@playwright/test';

test.describe('Student Management', () => {
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

  test('should navigate to students page', async ({ page }) => {
    await page.click('text=Students');
    await expect(page).toHaveURL('/students');
    await expect(page.locator('h1')).toContainText('Students');
  });

  test('should add a new student', async ({ page }) => {
    await page.goto('/students');
    
    // Click add student button
    await page.click('button:has-text("Add Student")');
    
    // Fill in student details
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '555-0123');
    await page.selectOption('select[name="academicYear"]', 'Freshman');
    await page.fill('input[name="major"]', 'Computer Science');
    
    // Save student
    await page.click('button:has-text("Save")');
    
    // Verify student appears in list
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john.doe@example.com')).toBeVisible();
  });

  test('should search for students', async ({ page }) => {
    // Add a student first
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Jane Smith');
    await page.fill('input[name="email"]', 'jane.smith@example.com');
    await page.click('button:has-text("Save")');
    
    // Search for the student
    await page.fill('input[placeholder*="Search"]', 'Jane');
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    
    // Search for non-existent student
    await page.fill('input[placeholder*="Search"]', 'NonExistent');
    await expect(page.locator('text=Jane Smith')).not.toBeVisible();
  });

  test('should view student details', async ({ page }) => {
    // Add a student
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Test Student');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Save")');
    
    // Click on student to view details
    await page.click('text=Test Student');
    
    // Should navigate to student detail page
    await expect(page).toHaveURL(/\/students\/\d+/);
    await expect(page.locator('h1')).toContainText('Test Student');
  });

  test('should edit student information', async ({ page }) => {
    // Add a student
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Edit Test');
    await page.fill('input[name="email"]', 'edit@example.com');
    await page.click('button:has-text("Save")');
    
    // Click on student
    await page.click('text=Edit Test');
    
    // Edit student
    await page.click('button:has-text("Edit")');
    await page.fill('input[name="name"]', 'Edited Name');
    await page.click('button:has-text("Save")');
    
    // Verify changes
    await expect(page.locator('h1')).toContainText('Edited Name');
  });

  test('should add notes to student', async ({ page }) => {
    // Add a student
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Note Test');
    await page.fill('input[name="email"]', 'note@example.com');
    await page.click('button:has-text("Save")');
    
    // Go to student detail
    await page.click('text=Note Test');
    
    // Add a note
    await page.fill('textarea[placeholder*="Add a note"]', 'This is a test note');
    await page.click('button:has-text("Add Note")');
    
    // Verify note appears
    await expect(page.locator('text=This is a test note')).toBeVisible();
  });

  test('should filter students by academic year', async ({ page }) => {
    await page.goto('/students');
    
    // Add students with different years
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Freshman Student');
    await page.fill('input[name="email"]', 'fresh@example.com');
    await page.selectOption('select[name="academicYear"]', 'Freshman');
    await page.click('button:has-text("Save")');
    
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Senior Student');
    await page.fill('input[name="email"]', 'senior@example.com');
    await page.selectOption('select[name="academicYear"]', 'Senior');
    await page.click('button:has-text("Save")');
    
    // Filter by Freshman
    await page.selectOption('select[aria-label="Filter by academic year"]', 'Freshman');
    await expect(page.locator('text=Freshman Student')).toBeVisible();
    await expect(page.locator('text=Senior Student')).not.toBeVisible();
  });
});