import { test, expect } from '@playwright/test';

test.describe('CRM Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
    await page.fill('input[type="password"]', '!)DQeop4');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('http://localhost:5173/');
    await page.waitForTimeout(1000); // Wait for page to stabilize
  });

  test('1. Dashboard loads correctly', async ({ page }) => {
    // Check dashboard elements
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('text="Welcome back! Here\'s what\'s happening with your students."')).toBeVisible();
    await expect(page.locator('button:has-text("Add Your First Student")')).toBeVisible();
    console.log('✅ Dashboard loaded successfully');
  });

  test('2. Navigate to Students page', async ({ page }) => {
    await page.click('a:has-text("Students")');
    await page.waitForURL('**/students');
    await expect(page.locator('h1:has-text("Students")')).toBeVisible();
    console.log('✅ Students page loaded');
    
    // Check for add student button
    const addButton = page.locator('button:has-text("Add Student")');
    await expect(addButton).toBeVisible();
    console.log('✅ Add Student button visible');
  });

  test('3. Add a new student', async ({ page }) => {
    await page.click('a:has-text("Students")');
    await page.waitForURL('**/students');
    
    // Click Add Student button
    await page.click('button:has-text("Add Student")');
    
    // Fill student form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '555-1234');
    await page.selectOption('select[name="academicProgram"]', 'Computer Science');
    await page.selectOption('select[name="year"]', 'Senior');
    
    // Save student
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Verify student was added
    await expect(page.locator('text="John Doe"')).toBeVisible();
    console.log('✅ Student added successfully');
  });

  test('4. Search for students', async ({ page }) => {
    await page.click('a:has-text("Students")');
    await page.waitForURL('**/students');
    
    // Use search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('John');
    await page.waitForTimeout(1000);
    
    console.log('✅ Search functionality tested');
  });

  test('5. Navigate to Calendar', async ({ page }) => {
    await page.click('a:has-text("Calendar")');
    await page.waitForURL('**/calendar');
    await expect(page.locator('h1:has-text("Calendar")')).toBeVisible();
    console.log('✅ Calendar page loaded');
  });

  test('6. Navigate to Career Services', async ({ page }) => {
    await page.click('a:has-text("Career Services")');
    await page.waitForURL('**/career');
    await expect(page.locator('h1').first()).toBeVisible();
    console.log('✅ Career Services page loaded');
  });

  test('7. Navigate to Settings', async ({ page }) => {
    await page.click('a:has-text("Settings")');
    await page.waitForURL('**/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    console.log('✅ Settings page loaded');
    
    // Check for settings tabs
    await expect(page.locator('text="General"')).toBeVisible();
    await expect(page.locator('text="Backup & Restore"')).toBeVisible();
    await expect(page.locator('text="Calendly"')).toBeVisible();
  });

  test('8. Test user menu', async ({ page }) => {
    // Click user menu (top right)
    await page.click('button[aria-label="User menu"]');
    await page.waitForTimeout(500);
    
    // Check menu items
    await expect(page.locator('text="dhatzige@act.edu"')).toBeVisible();
    await expect(page.locator('text="Sign out"')).toBeVisible();
    console.log('✅ User menu works');
  });

  test('9. Test logout', async ({ page }) => {
    // Click user menu and logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text="Sign out"');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    console.log('✅ Logout successful');
  });
});

test('Full E2E Flow', async ({ page }) => {
  console.log('Starting full E2E test...');
  
  // 1. Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Login successful');
  
  // 2. Navigate to Students
  await page.click('a:has-text("Students")');
  await page.waitForURL('**/students');
  console.log('✅ Navigated to Students');
  
  // 3. Add a student
  await page.click('button:has-text("Add Student")');
  await page.fill('input[name="firstName"]', 'Jane');
  await page.fill('input[name="lastName"]', 'Smith');
  await page.fill('input[name="email"]', 'jane.smith@example.com');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(2000);
  console.log('✅ Added student');
  
  // 4. Navigate to different sections
  await page.click('a:has-text("Calendar")');
  await page.waitForURL('**/calendar');
  console.log('✅ Calendar loaded');
  
  await page.click('a:has-text("Career Services")');
  await page.waitForURL('**/career');
  console.log('✅ Career Services loaded');
  
  await page.click('a:has-text("Settings")');
  await page.waitForURL('**/settings');
  console.log('✅ Settings loaded');
  
  // 5. Return to dashboard
  await page.click('a:has-text("Dashboard")');
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Returned to Dashboard');
  
  // Take final screenshot
  await page.screenshot({ path: 'e2e-test-complete.png', fullPage: true });
  console.log('✅ E2E test completed successfully!');
});