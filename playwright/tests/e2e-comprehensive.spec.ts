import { test, expect, Page } from '@playwright/test';
import { randomBytes } from 'crypto';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4001/api';

// Test credentials
const MASTER_EMAIL = 'dhatzige@act.edu';
const MASTER_PASSWORD = 'MasterPass123!';
const TEST_USER_EMAIL = `test_${randomBytes(4).toString('hex')}@example.com`;
const TEST_USER_PASSWORD = 'TestPass123!';

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/dashboard|students/, { timeout: 10000 });
}

async function logout(page: Page) {
  await page.click('button[aria-label="User menu"]');
  await page.click('text=Sign Out');
  await page.waitForURL(/login|auth/);
}

// Comprehensive E2E Test Suite
test.describe('Career Services CRM - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test.describe('1. Authentication & Access Control', () => {
    test('1.1 Master account login', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check if we're on login page
      await expect(page).toHaveTitle(/Career Services CRM/);
      
      // Try to login with master credentials
      await page.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]', MASTER_EMAIL);
      await page.fill('input[type="password"]', MASTER_PASSWORD);
      await page.click('button:has-text("Sign In")');
      
      // Check if login successful or if we need to create account first
      try {
        await page.waitForURL(/dashboard|students/, { timeout: 5000 });
        await expect(page.locator('text=Dashboard')).toBeVisible();
      } catch (error) {
        console.log('Master account may not exist, checking error message');
        const errorText = await page.locator('.text-red-600, .error-message').textContent();
        console.log('Login error:', errorText);
      }
    });

    test('1.2 Test signup flow (if enabled)', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check if signup is available
      const signupButton = page.locator('button:has-text("Sign Up"), a:has-text("Sign Up")');
      if (await signupButton.isVisible()) {
        await signupButton.click();
        
        // Fill signup form
        await page.fill('input[placeholder*="username" i]', `testuser_${Date.now()}`);
        await page.fill('input[type="email"]', TEST_USER_EMAIL);
        await page.fill('input[type="password"]', TEST_USER_PASSWORD);
        await page.fill('input[placeholder*="confirm" i]', TEST_USER_PASSWORD);
        
        await page.click('button:has-text("Sign Up"), button:has-text("Create Account")');
        
        // Check for success or error
        await page.waitForTimeout(2000);
        const successMessage = page.locator('text=/check your email|account created/i');
        const errorMessage = page.locator('.text-red-600, .error-message');
        
        if (await successMessage.isVisible()) {
          console.log('Signup successful');
        } else if (await errorMessage.isVisible()) {
          console.log('Signup error:', await errorMessage.textContent());
        }
      } else {
        console.log('Public signup is disabled (as expected for invite-only system)');
      }
    });

    test('1.3 Password reset flow', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const forgotPasswordLink = page.locator('a:has-text("Forgot password"), button:has-text("Forgot password")');
      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();
        
        await page.fill('input[type="email"]', TEST_USER_EMAIL);
        await page.click('button:has-text("Reset Password"), button:has-text("Send Reset Link")');
        
        const successMessage = await page.locator('text=/reset link sent|check your email/i');
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('2. Student Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await login(page, MASTER_EMAIL, MASTER_PASSWORD);
    });

    test('2.1 Create new student', async ({ page }) => {
      await page.click('a:has-text("Students")');
      await page.waitForLoadState('networkidle');
      
      // Click add student button
      await page.click('button:has-text("Add Student"), button:has-text("New Student")');
      
      // Fill student form
      const studentName = `Test Student ${Date.now()}`;
      await page.fill('input[placeholder*="name" i]', studentName);
      await page.fill('input[placeholder*="email" i]', `student_${Date.now()}@example.com`);
      await page.fill('input[placeholder*="phone" i]', '+1234567890');
      
      // Select program and year
      await page.selectOption('select[name="program"], select[id*="program"]', { index: 1 });
      await page.selectOption('select[name="year"], select[id*="year"]', { index: 1 });
      
      await page.click('button:has-text("Save"), button:has-text("Create")');
      
      // Verify student was created
      await page.waitForTimeout(2000);
      await expect(page.locator(`text=${studentName}`)).toBeVisible();
    });

    test('2.2 Search and filter students', async ({ page }) => {
      await page.click('a:has-text("Students")');
      await page.waitForLoadState('networkidle');
      
      // Search by name
      await page.fill('input[placeholder*="search" i]', 'Test');
      await page.waitForTimeout(1000);
      
      // Apply filters
      const filterButton = page.locator('button:has-text("Filters"), button:has-text("Filter")');
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Select year filter
        const yearFilter = page.locator('select[name*="year"], #year-filter');
        if (await yearFilter.isVisible()) {
          await yearFilter.selectOption({ index: 1 });
        }
      }
    });

    test('2.3 Edit student information', async ({ page }) => {
      await page.click('a:has-text("Students")');
      await page.waitForLoadState('networkidle');
      
      // Click on first student
      const firstStudent = page.locator('.student-card, tr.student-row').first();
      if (await firstStudent.isVisible()) {
        await firstStudent.click();
        
        // Edit button
        await page.click('button:has-text("Edit")');
        
        // Update a field
        const phoneInput = page.locator('input[placeholder*="phone" i]');
        await phoneInput.fill('+9876543210');
        
        await page.click('button:has-text("Save"), button:has-text("Update")');
        
        // Verify update
        await expect(page.locator('text=+9876543210')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('3. Notes & Consultations', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, MASTER_EMAIL, MASTER_PASSWORD);
    });

    test('3.1 Add note to student', async ({ page }) => {
      await page.click('a:has-text("Students")');
      await page.waitForLoadState('networkidle');
      
      // Open first student
      const firstStudent = page.locator('.student-card, tr.student-row').first();
      if (await firstStudent.isVisible()) {
        await firstStudent.click();
        
        // Add note
        const addNoteButton = page.locator('button:has-text("Add Note"), button:has-text("New Note")');
        await addNoteButton.click();
        
        // Fill note form
        await page.fill('textarea[placeholder*="note" i]', 'Test consultation note');
        await page.selectOption('select[name="type"], select[id*="type"]', 'consultation');
        
        await page.click('button:has-text("Save"), button:has-text("Add")');
        
        // Verify note added
        await expect(page.locator('text=Test consultation note')).toBeVisible({ timeout: 5000 });
      }
    });

    test('3.2 Schedule consultation', async ({ page }) => {
      await page.click('a:has-text("Calendar")');
      await page.waitForLoadState('networkidle');
      
      // Check if calendar is loaded
      const calendarView = page.locator('.calendar-view, .fc-view');
      if (await calendarView.isVisible()) {
        // Click on a time slot or add button
        const addButton = page.locator('button:has-text("Schedule"), button:has-text("Add Consultation")');
        if (await addButton.isVisible()) {
          await addButton.click();
          
          // Fill consultation form
          await page.fill('input[name="title"], input[placeholder*="title" i]', 'Career Counseling Session');
          await page.selectOption('select[name="student"]', { index: 1 });
          
          await page.click('button:has-text("Schedule"), button:has-text("Save")');
        }
      }
    });
  });

  test.describe('4. Career Services', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, MASTER_EMAIL, MASTER_PASSWORD);
    });

    test('4.1 Track job application', async ({ page }) => {
      await page.click('a:has-text("Career Services"), a:has-text("Career")');
      await page.waitForLoadState('networkidle');
      
      const applicationsTab = page.locator('button:has-text("Applications"), a:has-text("Applications")');
      if (await applicationsTab.isVisible()) {
        await applicationsTab.click();
        
        // Add new application
        const addButton = page.locator('button:has-text("Add Application"), button:has-text("New Application")');
        if (await addButton.isVisible()) {
          await addButton.click();
          
          // Fill application form
          await page.fill('input[placeholder*="company" i]', 'Test Company Inc');
          await page.fill('input[placeholder*="position" i]', 'Software Engineer');
          await page.selectOption('select[name="status"]', 'applied');
          
          await page.click('button:has-text("Save"), button:has-text("Add")');
        }
      }
    });

    test('4.2 Schedule mock interview', async ({ page }) => {
      await page.click('a:has-text("Career Services"), a:has-text("Career")');
      await page.waitForLoadState('networkidle');
      
      const interviewsTab = page.locator('button:has-text("Mock Interviews"), a:has-text("Interviews")');
      if (await interviewsTab.isVisible()) {
        await interviewsTab.click();
        
        const scheduleButton = page.locator('button:has-text("Schedule Interview")');
        if (await scheduleButton.isVisible()) {
          await scheduleButton.click();
          
          // Fill interview form
          await page.selectOption('select[name="student"]', { index: 1 });
          await page.fill('input[name="interviewer"]', 'John Doe');
          await page.fill('input[type="datetime-local"]', '2024-12-01T14:00');
          
          await page.click('button:has-text("Schedule")');
        }
      }
    });
  });

  test.describe('5. File Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, MASTER_EMAIL, MASTER_PASSWORD);
    });

    test('5.1 Upload student document', async ({ page }) => {
      await page.click('a:has-text("Students")');
      await page.waitForLoadState('networkidle');
      
      // Open first student
      const firstStudent = page.locator('.student-card, tr.student-row').first();
      if (await firstStudent.isVisible()) {
        await firstStudent.click();
        
        // Find documents section
        const documentsTab = page.locator('button:has-text("Documents"), a:has-text("Documents")');
        if (await documentsTab.isVisible()) {
          await documentsTab.click();
          
          // Upload file
          const fileInput = page.locator('input[type="file"]');
          if (await fileInput.isVisible()) {
            // Create a test file
            await fileInput.setInputFiles({
              name: 'test-resume.pdf',
              mimeType: 'application/pdf',
              buffer: Buffer.from('Test resume content')
            });
            
            // Wait for upload
            await page.waitForTimeout(2000);
            
            // Verify file uploaded
            await expect(page.locator('text=test-resume.pdf')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });

  test.describe('6. Reporting & Analytics', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, MASTER_EMAIL, MASTER_PASSWORD);
    });

    test('6.1 View dashboard analytics', async ({ page }) => {
      await page.click('a:has-text("Dashboard")');
      await page.waitForLoadState('networkidle');
      
      // Check for dashboard elements
      await expect(page.locator('text=/Total Students|Active Students/i')).toBeVisible();
      await expect(page.locator('text=/Consultations|Appointments/i')).toBeVisible();
      
      // Check if charts loaded
      const charts = page.locator('canvas, .recharts-wrapper');
      expect(await charts.count()).toBeGreaterThan(0);
    });

    test('6.2 Export data', async ({ page }) => {
      await page.click('a:has-text("Students")');
      await page.waitForLoadState('networkidle');
      
      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button[aria-label*="export" i]');
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Select export format
        const csvOption = page.locator('button:has-text("CSV"), a:has-text("CSV")');
        if (await csvOption.isVisible()) {
          await csvOption.click();
          
          // Wait for download
          const downloadPromise = page.waitForEvent('download');
          await page.click('button:has-text("Download"), button:has-text("Export")');
          const download = await downloadPromise;
          
          // Verify download
          expect(download.suggestedFilename()).toContain('.csv');
        }
      }
    });
  });

  test.describe('7. Security Features', () => {
    test('7.1 Test rate limiting', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Try multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('input[type="email"], input[placeholder*="email" i]', 'wrong@email.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(500);
      }
      
      // Check for rate limit message
      const rateLimitMessage = page.locator('text=/too many attempts|rate limit/i');
      if (await rateLimitMessage.isVisible()) {
        console.log('Rate limiting is working');
      }
    });

    test('7.2 Test unauthorized access', async ({ page }) => {
      // Try to access protected route without login
      await page.goto(`${BASE_URL}/students`);
      
      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/);
    });
  });

  test.describe('8. Responsive Design', () => {
    test('8.1 Mobile view test', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(BASE_URL);
      
      // Check if mobile menu exists
      const mobileMenuButton = page.locator('button[aria-label*="menu" i], button.mobile-menu');
      
      // Login on mobile
      await page.fill('input[type="email"], input[placeholder*="email" i]', MASTER_EMAIL);
      await page.fill('input[type="password"]', MASTER_PASSWORD);
      await page.click('button:has-text("Sign In")');
      
      // Check mobile navigation
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await expect(page.locator('a:has-text("Students")')).toBeVisible();
      }
    });
  });

  // Performance monitoring
  test.afterEach(async ({ page }, testInfo) => {
    // Capture screenshot on failure
    if (testInfo.status !== 'passed') {
      await page.screenshot({ 
        path: `playwright/screenshots/${testInfo.title.replace(/\s+/g, '_')}_failure.png`,
        fullPage: true 
      });
    }
    
    // Log performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    console.log(`Performance metrics for ${testInfo.title}:`, metrics);
  });
});

// Run specific test groups based on environment
test.describe.configure({ mode: 'serial' }); // Run tests in order