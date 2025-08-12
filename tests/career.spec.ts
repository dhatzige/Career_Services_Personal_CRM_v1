import { test, expect } from '@playwright/test';

test.describe('Career Services', () => {
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
    
    // Add a test student
    await page.goto('/students');
    await page.click('button:has-text("Add Student")');
    await page.fill('input[name="name"]', 'Career Test Student');
    await page.fill('input[name="email"]', 'career@example.com');
    await page.click('button:has-text("Save")');
  });

  test('should navigate to career services page', async ({ page }) => {
    await page.click('text=Career Services');
    await expect(page).toHaveURL('/career');
    await expect(page.locator('h1')).toContainText('Career Services');
  });

  test('should track job applications', async ({ page }) => {
    await page.goto('/career');
    
    // Add new application
    await page.click('button:has-text("Add Application")');
    
    // Fill application details
    await page.fill('input[name="company"]', 'Tech Corp');
    await page.fill('input[name="position"]', 'Software Engineer');
    await page.selectOption('select[name="status"]', 'Applied');
    await page.fill('input[name="applicationDate"]', '2024-01-15');
    
    // Save application
    await page.click('button:has-text("Save")');
    
    // Verify application appears
    await expect(page.locator('text=Tech Corp')).toBeVisible();
    await expect(page.locator('text=Software Engineer')).toBeVisible();
  });

  test('should update application status', async ({ page }) => {
    await page.goto('/career');
    
    // Add application
    await page.click('button:has-text("Add Application")');
    await page.fill('input[name="company"]', 'Update Test Co');
    await page.fill('input[name="position"]', 'Developer');
    await page.selectOption('select[name="status"]', 'Applied');
    await page.click('button:has-text("Save")');
    
    // Update status
    await page.click('text=Update Test Co');
    await page.selectOption('select[name="status"]', 'Interview Scheduled');
    await page.click('button:has-text("Update")');
    
    // Verify status change
    await expect(page.locator('text=Interview Scheduled')).toBeVisible();
  });

  test('should track mock interviews', async ({ page }) => {
    await page.goto('/career');
    
    // Navigate to mock interviews tab
    await page.click('text=Mock Interviews');
    
    // Schedule mock interview
    await page.click('button:has-text("Schedule Mock Interview")');
    await page.fill('input[name="date"]', '2024-01-20');
    await page.fill('input[name="interviewer"]', 'John Smith');
    await page.selectOption('select[name="type"]', 'Technical');
    await page.click('button:has-text("Schedule")');
    
    // Verify interview appears
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=Technical')).toBeVisible();
  });

  test('should manage career documents', async ({ page }) => {
    await page.goto('/career');
    
    // Navigate to documents tab
    await page.click('text=Documents');
    
    // Add document reference
    await page.click('button:has-text("Add Document")');
    await page.fill('input[name="documentName"]', 'Resume v2');
    await page.selectOption('select[name="documentType"]', 'Resume');
    await page.fill('textarea[name="notes"]', 'Updated with latest experience');
    await page.click('button:has-text("Save")');
    
    // Verify document appears
    await expect(page.locator('text=Resume v2')).toBeVisible();
  });

  test('should track workshop attendance', async ({ page }) => {
    await page.goto('/career');
    
    // Navigate to workshops tab
    await page.click('text=Workshops');
    
    // Add workshop attendance
    await page.click('button:has-text("Add Workshop")');
    await page.fill('input[name="workshopName"]', 'Resume Writing Workshop');
    await page.fill('input[name="date"]', '2024-01-10');
    await page.selectOption('select[name="type"]', 'Career Development');
    await page.click('button:has-text("Save")');
    
    // Verify workshop appears
    await expect(page.locator('text=Resume Writing Workshop')).toBeVisible();
  });

  test('should track employer connections', async ({ page }) => {
    await page.goto('/career');
    
    // Navigate to employer connections tab
    await page.click('text=Employer Connections');
    
    // Add employer connection
    await page.click('button:has-text("Add Connection")');
    await page.fill('input[name="employerName"]', 'ABC Company');
    await page.fill('input[name="contactName"]', 'Jane Doe');
    await page.fill('input[name="contactEmail"]', 'jane@abc.com');
    await page.selectOption('select[name="connectionType"]', 'Career Fair');
    await page.click('button:has-text("Save")');
    
    // Verify connection appears
    await expect(page.locator('text=ABC Company')).toBeVisible();
    await expect(page.locator('text=Jane Doe')).toBeVisible();
  });

  test('should filter applications by status', async ({ page }) => {
    await page.goto('/career');
    
    // Add multiple applications
    await page.click('button:has-text("Add Application")');
    await page.fill('input[name="company"]', 'Applied Co');
    await page.selectOption('select[name="status"]', 'Applied');
    await page.click('button:has-text("Save")');
    
    await page.click('button:has-text("Add Application")');
    await page.fill('input[name="company"]', 'Interview Co');
    await page.selectOption('select[name="status"]', 'Interview Scheduled');
    await page.click('button:has-text("Save")');
    
    // Filter by Applied status
    await page.selectOption('select[aria-label="Filter by status"]', 'Applied');
    await expect(page.locator('text=Applied Co')).toBeVisible();
    await expect(page.locator('text=Interview Co')).not.toBeVisible();
  });
});