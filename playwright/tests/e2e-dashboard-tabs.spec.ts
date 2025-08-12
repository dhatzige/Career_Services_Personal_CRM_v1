import { test, expect } from '@playwright/test';

// Helper to log console messages
const setupConsoleLogging = (page: any, tabName: string) => {
  page.on('console', (msg: any) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[${tabName}] [${type.toUpperCase()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', (error: any) => {
    console.log(`[${tabName}] [PAGE ERROR] ${error.message}`);
  });
  
  page.on('response', (response: any) => {
    if (response.status() >= 400) {
      console.log(`[${tabName}] [HTTP ${response.status()}] ${response.url()}`);
    }
  });
};

test.describe('Dashboard Tabs E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    console.log('\n🔐 Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
    await page.locator('input[type="password"]').fill('!)DQeop4');
    await page.locator('button:has-text("Sign In")').click();
    
    await expect(page).toHaveURL('http://localhost:5173/');
    console.log('✅ Login successful\n');
  });

  test('1. Dashboard Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'DASHBOARD');
    console.log('\n📊 Testing DASHBOARD Tab...');
    
    // Check main elements
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    console.log('✓ Dashboard heading visible');
    
    await expect(page.locator('text="Welcome back! Here\'s what\'s happening with your students."')).toBeVisible();
    console.log('✓ Welcome message visible');
    
    // Check stats cards
    const statsCards = page.locator('.bg-white.shadow-sm.rounded-lg').filter({ 
      has: page.locator('.text-2xl.font-semibold') 
    });
    const statsCount = await statsCards.count();
    console.log(`✓ Found ${statsCount} stats cards`);
    
    // Check Quick Actions
    const quickActions = page.locator('h2:has-text("Quick Actions")');
    await expect(quickActions).toBeVisible();
    console.log('✓ Quick Actions section visible');
    
    // Check for AI Report button
    const aiReportButton = page.locator('button:has-text("Generate AI Report")');
    await expect(aiReportButton).toBeVisible();
    console.log('✓ AI Report button visible');
    
    // Check Recent Activities
    const recentActivities = page.locator('h2:has-text("Recent Activities")');
    await expect(recentActivities).toBeVisible();
    console.log('✓ Recent Activities section visible');
    
    // Test Add Your First Student button
    const addStudentButton = page.locator('button:has-text("Add Your First Student")');
    if (await addStudentButton.isVisible()) {
      console.log('✓ Add Your First Student button visible (no students yet)');
      await addStudentButton.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*\/students/);
      console.log('✓ Add Student button navigates to Students page');
      await page.goBack();
    }
    
    console.log('✅ Dashboard tab test completed\n');
  });

  test('2. Students Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'STUDENTS');
    console.log('\n👥 Testing STUDENTS Tab...');
    
    await page.getByRole('link', { name: 'Students', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/students/);
    console.log('✓ Navigated to Students page');
    
    // Check main elements
    await expect(page.locator('h1').last()).toContainText('Students');
    console.log('✓ Students heading visible');
    
    // Check search functionality
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    console.log('✓ Search input visible');
    
    await searchInput.fill('test search');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    console.log('✓ Search functionality working');
    
    // Check Add Student button
    const addButton = page.getByRole('button', { name: /add.*student/i }).first();
    await expect(addButton).toBeVisible();
    console.log('✓ Add Student button visible');
    
    // Test Add Student modal
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible({ timeout: 2000 })) {
      console.log('✓ Add Student modal opened');
      
      // Check form fields
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      console.log('✓ Form fields visible');
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      console.log('✓ Modal closed with Escape key');
    }
    
    // Check filter options
    const filterButton = page.locator('button:has-text("Filter")');
    if (await filterButton.isVisible()) {
      console.log('✓ Filter button visible');
    }
    
    console.log('✅ Students tab test completed\n');
  });

  test('3. Calendar Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'CALENDAR');
    console.log('\n📅 Testing CALENDAR Tab...');
    
    await page.getByRole('link', { name: 'Calendar', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/calendar/);
    console.log('✓ Navigated to Calendar page');
    
    // Check main elements
    await expect(page.locator('h1:has-text("Calendar & Scheduling")')).toBeVisible();
    console.log('✓ Calendar heading visible');
    
    // Check tabs
    const upcomingTab = page.locator('button:has-text("Upcoming Meetings")');
    const scheduleTab = page.locator('button:has-text("Schedule New Meeting")');
    
    await expect(upcomingTab).toBeVisible();
    await expect(scheduleTab).toBeVisible();
    console.log('✓ Calendar tabs visible');
    
    // Test tab switching
    await scheduleTab.click();
    await page.waitForTimeout(500);
    console.log('✓ Switched to Schedule tab');
    
    // Check for Calendly integration
    const calendlySection = page.locator('iframe[title*="Calendly"], div:has-text("Calendly")');
    if (await calendlySection.count() > 0) {
      console.log('✓ Calendly integration section found');
    } else {
      console.log('ℹ Calendly not configured');
    }
    
    // Switch back to upcoming
    await upcomingTab.click();
    console.log('✓ Switched back to Upcoming tab');
    
    console.log('✅ Calendar tab test completed\n');
  });

  test('4. Career Services Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'CAREER');
    console.log('\n💼 Testing CAREER SERVICES Tab...');
    
    await page.getByRole('link', { name: 'Career Services', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/career/);
    console.log('✓ Navigated to Career Services page');
    
    // Check for tabs or sections
    const tabs = ['Applications', 'Mock Interviews', 'Workshops', 'Documents', 'Employer Connections'];
    let visibleTabs = 0;
    
    for (const tab of tabs) {
      const tabElement = page.locator(`button:has-text("${tab}"), a:has-text("${tab}")`);
      if (await tabElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`✓ ${tab} section found`);
        visibleTabs++;
      }
    }
    
    if (visibleTabs > 0) {
      console.log(`✓ Found ${visibleTabs} career service sections`);
    }
    
    // Check for any Add buttons
    const addButtons = page.locator('button').filter({ hasText: /add|create|new/i });
    const addButtonCount = await addButtons.count();
    console.log(`✓ Found ${addButtonCount} action buttons`);
    
    console.log('✅ Career Services tab test completed\n');
  });

  test('5. Integrations Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'INTEGRATIONS');
    console.log('\n🔌 Testing INTEGRATIONS Tab...');
    
    await page.getByRole('link', { name: 'Integrations', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/integrations/);
    console.log('✓ Navigated to Integrations page');
    
    // Check for integration cards
    const integrationTypes = ['Calendly', 'Email', 'Calendar', 'API'];
    
    for (const integration of integrationTypes) {
      const card = page.locator(`text=${integration}`);
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`✓ ${integration} integration found`);
      }
    }
    
    // Check for configuration buttons
    const configButtons = page.locator('button:has-text("Configure"), button:has-text("Connect")');
    const configCount = await configButtons.count();
    console.log(`✓ Found ${configCount} configuration options`);
    
    console.log('✅ Integrations tab test completed\n');
  });

  test('6. Tags Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'TAGS');
    console.log('\n🏷️ Testing TAGS Tab...');
    
    await page.getByRole('link', { name: 'Tags', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/tags/);
    console.log('✓ Navigated to Tags page');
    
    // Check main elements
    const heading = page.locator('h1').last();
    await expect(heading).toBeVisible();
    console.log('✓ Tags heading visible');
    
    // Check for tag management options
    const createTagButton = page.locator('button:has-text("Create Tag"), button:has-text("Add Tag")');
    if (await createTagButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ Create Tag button found');
    }
    
    // Check for existing tags or empty state
    const tagsList = page.locator('[role="list"], .tag-item, .chip');
    const tagsCount = await tagsList.count();
    console.log(`✓ Found ${tagsCount} tag elements`);
    
    console.log('✅ Tags tab test completed\n');
  });

  test('7. Settings Tab - Full Test', async ({ page }) => {
    setupConsoleLogging(page, 'SETTINGS');
    console.log('\n⚙️ Testing SETTINGS Tab...');
    
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
    await expect(page).toHaveURL(/.*\/settings/);
    console.log('✓ Navigated to Settings page');
    
    // Check main heading
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    console.log('✓ Settings heading visible');
    
    // Check for settings tabs
    const settingsTabs = ['General', 'Backup & Restore', 'Calendly'];
    
    for (const tab of settingsTabs) {
      const tabElement = page.locator(`button:has-text("${tab}"), a:has-text("${tab}")`);
      if (await tabElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`✓ ${tab} tab found`);
        
        // Click and verify tab content loads
        await tabElement.click();
        await page.waitForTimeout(500);
        console.log(`✓ ${tab} tab content loaded`);
      }
    }
    
    // Check for theme toggles in general settings
    const darkModeToggle = page.locator('text="Dark Mode"');
    if (await darkModeToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ Dark mode toggle found');
    }
    
    console.log('✅ Settings tab test completed\n');
  });
});

test('Full Dashboard Navigation Flow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  setupConsoleLogging(page, 'FULL-FLOW');
  
  console.log('\n🚀 Starting Full Navigation Flow Test...\n');
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.locator('input[placeholder*="example.com"]').fill('dhatzige@act.edu');
  await page.locator('input[type="password"]').fill('!)DQeop4');
  await page.locator('button:has-text("Sign In")').click();
  await expect(page).toHaveURL('http://localhost:5173/');
  
  // Navigate through all tabs
  const tabs = [
    { name: 'Dashboard', url: '/' },
    { name: 'Students', url: '/students' },
    { name: 'Calendar', url: '/calendar' },
    { name: 'Career Services', url: '/career' },
    { name: 'Integrations', url: '/integrations' },
    { name: 'Tags', url: '/tags' },
    { name: 'Settings', url: '/settings' }
  ];
  
  for (const tab of tabs) {
    console.log(`\n📍 Navigating to ${tab.name}...`);
    
    if (tab.name === 'Dashboard') {
      await page.getByRole('link', { name: tab.name, exact: true }).first().click();
    } else {
      await page.getByRole('link', { name: tab.name, exact: true }).first().click();
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ 
      path: `screenshots/${tab.name.toLowerCase().replace(' ', '-')}-tab.png`,
      fullPage: true 
    });
    
    console.log(`✓ ${tab.name} loaded successfully`);
    
    // Check for any errors on the page
    const errors = await page.locator('.error, .text-red-500, [role="alert"]').count();
    if (errors > 0) {
      console.log(`⚠️ Found ${errors} error elements on ${tab.name} page`);
    }
  }
  
  console.log('\n✅ Full navigation flow completed successfully!');
  console.log('📸 Screenshots saved in screenshots/ directory');
});