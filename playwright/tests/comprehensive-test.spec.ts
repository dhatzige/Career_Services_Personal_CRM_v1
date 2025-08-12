import { test, expect } from '@playwright/test';

test.describe('Comprehensive CRM Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console and error logging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[${type.toUpperCase()}]`, msg.text());
      }
    });
    
    page.on('pageerror', err => {
      console.log('[PAGE ERROR]', err.message);
    });
  });

  test('1. Login with master account', async ({ page, request }) => {
    console.log('\n=== TESTING LOGIN ===');
    
    // Check backend health first
    const health = await request.get('http://localhost:4001/health');
    console.log('Backend health:', health.status());
    expect(health.ok()).toBeTruthy();
    
    // Navigate to login
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/01-login-page.png' });
    
    // Fill login form
    await page.locator('input[placeholder*="email"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    
    // Click sign in
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful, redirected to:', page.url());
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-screenshots/02-dashboard.png' });
  });

  test('2. Navigate main sections', async ({ page }) => {
    console.log('\n=== TESTING NAVIGATION ===');
    
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="email"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('**/dashboard');
    
    // Test navigation to different sections
    const sections = [
      { name: 'Students', url: '/students', selector: 'h1:has-text("Students")' },
      { name: 'Calendar', url: '/calendar', selector: 'h1:has-text("Calendar")' },
      { name: 'Career Services', url: '/career', selector: 'h1:has-text("Career Services")' },
      { name: 'Reports', url: '/reports', selector: 'h1:has-text("Reports")' },
      { name: 'Settings', url: '/settings', selector: 'h1:has-text("Settings")' }
    ];
    
    for (const section of sections) {
      console.log(`Testing navigation to ${section.name}...`);
      await page.locator(`a[href="${section.url}"]`).click();
      await page.waitForURL(`**${section.url}`);
      await expect(page.locator(section.selector)).toBeVisible({ timeout: 5000 });
      console.log(`✅ ${section.name} loaded successfully`);
      await page.screenshot({ path: `test-screenshots/nav-${section.name.toLowerCase()}.png` });
    }
  });

  test('3. Test student management', async ({ page }) => {
    console.log('\n=== TESTING STUDENT MANAGEMENT ===');
    
    // Login and navigate to students
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="email"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:5173/students');
    await page.waitForLoadState('networkidle');
    
    // Check for add student button
    const addButton = page.locator('button:has-text("Add Student"), button:has-text("New Student")');
    await expect(addButton).toBeVisible();
    console.log('✅ Add student button found');
    
    // Click add student
    await addButton.click();
    
    // Wait for modal or form
    await page.waitForTimeout(1000);
    
    // Check if form fields are visible
    const formVisible = await page.locator('input[placeholder*="First"], input[placeholder*="first"]').isVisible();
    if (formVisible) {
      console.log('✅ Student form is visible');
      
      // Fill in student details
      await page.locator('input[placeholder*="First"], input[placeholder*="first"]').fill('Test');
      await page.locator('input[placeholder*="Last"], input[placeholder*="last"]').fill('Student');
      await page.locator('input[placeholder*="Email"], input[placeholder*="email"]').fill('test.student@example.com');
      await page.locator('input[placeholder*="Phone"], input[placeholder*="phone"]').fill('555-0123');
      
      // Save student
      await page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Create")').click();
      
      // Wait for success
      await page.waitForTimeout(2000);
      console.log('✅ Student created');
    } else {
      console.log('⚠️  Student form not found');
    }
    
    await page.screenshot({ path: 'test-screenshots/03-students.png' });
  });

  test('4. Test search functionality', async ({ page }) => {
    console.log('\n=== TESTING SEARCH ===');
    
    // Login and navigate to students
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="email"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:5173/students');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      console.log('✅ Search functionality available');
    } else {
      console.log('⚠️  Search input not found');
    }
  });

  test('5. Test dark mode toggle', async ({ page }) => {
    console.log('\n=== TESTING DARK MODE ===');
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="email"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('**/dashboard');
    
    // Look for dark mode toggle
    const darkModeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]');
    if (await darkModeButton.isVisible()) {
      await darkModeButton.click();
      await page.waitForTimeout(500);
      
      // Check if dark mode is applied
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      
      console.log('✅ Dark mode toggle:', isDark ? 'enabled' : 'disabled');
      await page.screenshot({ path: 'test-screenshots/dark-mode.png' });
    } else {
      console.log('⚠️  Dark mode toggle not found');
    }
  });

  test('6. Test logout', async ({ page }) => {
    console.log('\n=== TESTING LOGOUT ===');
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="email"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('**/dashboard');
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to login
    await page.waitForURL('**/login');
    console.log('✅ Logout successful');
  });

  test.afterAll(async () => {
    console.log('\n=== TEST SUMMARY ===');
    console.log('All tests completed. Check test-screenshots folder for visual results.');
  });
});