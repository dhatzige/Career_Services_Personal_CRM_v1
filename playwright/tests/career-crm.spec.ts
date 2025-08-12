import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4001/api';

// Master account credentials
const MASTER_CREDENTIALS = {
  email: 'dhatzige@act.edu',
  password: '!)DQeop4'
};

// Test data
const TEST_STUDENT = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.edu',
  phone: '+1 (555) 123-4567',
  yearOfStudy: '3rd year',
  programType: "Bachelor's",
  specificProgram: 'Computer Science',
  major: 'Software Engineering',
  status: 'Active'
};

const TEST_USER = {
  email: 'test.admin@act.edu',
  password: 'TestPassword123!',
  role: 'admin'
};

test.describe('Career Services CRM - Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Authentication', () => {
    test('should show login page by default', async ({ page }) => {
      await expect(page).toHaveTitle(/Career Services CRM/);
      await expect(page.locator('h1')).toContainText(/Sign in to your account/i);
    });

    test('should login with master account', async ({ page }) => {
      // Fill in login form
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard');
      
      // Verify we're on dashboard
      await expect(page.locator('h1')).toContainText(/Dashboard/i);
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('.text-red-600')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      
      // Find and click logout button
      await page.click('button:has-text("Sign out")');
      
      // Should redirect to login
      await expect(page).toHaveURL(BASE_URL + '/login');
    });
  });

  test.describe('Student Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(BASE_URL + '/login');
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should navigate to students page', async ({ page }) => {
      // Click students link in navigation
      await page.click('a:has-text("Students")');
      await page.waitForURL('**/students');
      
      await expect(page.locator('h1')).toContainText(/Students/i);
      await expect(page.locator('button:has-text("Add Student")')).toBeVisible();
    });

    test('should add a new student', async ({ page }) => {
      await page.goto(BASE_URL + '/students');
      
      // Click add student button
      await page.click('button:has-text("Add Student")');
      
      // Fill in student form
      await page.fill('input[name="firstName"]', TEST_STUDENT.firstName);
      await page.fill('input[name="lastName"]', TEST_STUDENT.lastName);
      await page.fill('input[name="email"]', TEST_STUDENT.email);
      await page.fill('input[name="phone"]', TEST_STUDENT.phone);
      
      // Select year of study
      await page.selectOption('select[name="yearOfStudy"]', TEST_STUDENT.yearOfStudy);
      
      // Fill other fields
      await page.fill('input[name="major"]', TEST_STUDENT.major);
      
      // Submit form
      await page.click('button:has-text("Save")');
      
      // Wait for success message or redirect
      await page.waitForLoadState('networkidle');
      
      // Verify student appears in list
      await expect(page.locator(`text=${TEST_STUDENT.firstName} ${TEST_STUDENT.lastName}`)).toBeVisible();
    });

    test('should search for students', async ({ page }) => {
      await page.goto(BASE_URL + '/students');
      
      // Search for the student we created
      await page.fill('input[placeholder*="Search"]', TEST_STUDENT.lastName);
      
      // Verify search results
      await expect(page.locator(`text=${TEST_STUDENT.firstName} ${TEST_STUDENT.lastName}`)).toBeVisible();
    });

    test('should view student details', async ({ page }) => {
      await page.goto(BASE_URL + '/students');
      
      // Click on student name
      await page.click(`text=${TEST_STUDENT.firstName} ${TEST_STUDENT.lastName}`);
      
      // Wait for student detail page
      await page.waitForLoadState('networkidle');
      
      // Verify student information is displayed
      await expect(page.locator('text=' + TEST_STUDENT.email)).toBeVisible();
      await expect(page.locator('text=' + TEST_STUDENT.phone)).toBeVisible();
    });

    test('should add note to student', async ({ page }) => {
      await page.goto(BASE_URL + '/students');
      await page.click(`text=${TEST_STUDENT.firstName} ${TEST_STUDENT.lastName}`);
      
      // Find and click add note button
      await page.click('button:has-text("Add Note")');
      
      // Fill note content
      const noteText = 'Test consultation note - student showed interest in internship opportunities';
      await page.fill('textarea', noteText);
      
      // Save note
      await page.click('button:has-text("Save Note")');
      
      // Verify note appears
      await expect(page.locator('text=' + noteText)).toBeVisible();
    });

    test('should edit student information', async ({ page }) => {
      await page.goto(BASE_URL + '/students');
      await page.click(`text=${TEST_STUDENT.firstName} ${TEST_STUDENT.lastName}`);
      
      // Click edit button
      await page.click('button:has-text("Edit")');
      
      // Update year of study
      await page.selectOption('select[name="yearOfStudy"]', '4th year');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      // Verify update
      await expect(page.locator('text=4th year')).toBeVisible();
    });
  });

  test.describe('Consultation Scheduling', () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto(BASE_URL + '/login');
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should navigate to consultations page', async ({ page }) => {
      await page.click('a:has-text("Consultations")');
      await page.waitForURL('**/consultations');
      
      await expect(page.locator('h1')).toContainText(/Consultations/i);
    });

    test('should schedule a consultation', async ({ page }) => {
      await page.goto(BASE_URL + '/consultations');
      
      // Click schedule consultation
      await page.click('button:has-text("Schedule Consultation")');
      
      // Select student
      await page.selectOption('select[name="studentId"]', { index: 1 });
      
      // Select date and time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '14:00');
      
      // Select consultation type
      await page.selectOption('select[name="consultationType"]', 'Career Counseling');
      
      // Set duration
      await page.fill('input[name="duration"]', '30');
      
      // Add notes
      await page.fill('textarea[name="notes"]', 'Initial career counseling session');
      
      // Save
      await page.click('button:has-text("Schedule")');
      
      // Verify consultation appears
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Career Counseling')).toBeVisible();
    });
  });

  test.describe('Career Services Features', () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto(BASE_URL + '/login');
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should track job application', async ({ page }) => {
      await page.goto(BASE_URL + '/career-services');
      
      // Click on job applications tab
      await page.click('text=Job Applications');
      
      // Add new application
      await page.click('button:has-text("Add Application")');
      
      // Fill application details
      await page.selectOption('select[name="studentId"]', { index: 1 });
      await page.fill('input[name="companyName"]', 'Tech Corp');
      await page.fill('input[name="positionTitle"]', 'Software Engineer Intern');
      await page.fill('input[name="applicationDate"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name="status"]', 'Applied');
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Verify application appears
      await expect(page.locator('text=Tech Corp')).toBeVisible();
    });

    test('should schedule mock interview', async ({ page }) => {
      await page.goto(BASE_URL + '/career-services');
      
      // Click on mock interviews tab
      await page.click('text=Mock Interviews');
      
      // Schedule new interview
      await page.click('button:has-text("Schedule Interview")');
      
      // Fill details
      await page.selectOption('select[name="studentId"]', { index: 1 });
      await page.fill('input[name="interviewType"]', 'Technical Interview');
      await page.fill('input[name="scheduledDate"]', new Date().toISOString().split('T')[0]);
      await page.fill('input[name="duration"]', '60');
      
      // Save
      await page.click('button:has-text("Schedule")');
      
      // Verify interview appears
      await expect(page.locator('text=Technical Interview')).toBeVisible();
    });
  });

  test.describe('User Management (Admin Features)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as master
      await page.goto(BASE_URL + '/login');
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should access admin panel', async ({ page }) => {
      // Navigate to admin section
      await page.click('a:has-text("Admin")');
      await page.waitForURL('**/admin');
      
      await expect(page.locator('h1')).toContainText(/Admin/i);
    });

    test('should invite new user', async ({ page }) => {
      await page.goto(BASE_URL + '/admin/users');
      
      // Click invite user
      await page.click('button:has-text("Invite User")');
      
      // Fill invitation form
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.selectOption('select[name="role"]', TEST_USER.role);
      
      // Send invitation
      await page.click('button:has-text("Send Invitation")');
      
      // Verify success message
      await expect(page.locator('text=Invitation sent')).toBeVisible();
    });

    test('should view audit logs', async ({ page }) => {
      await page.goto(BASE_URL + '/admin/audit-logs');
      
      // Verify audit logs are displayed
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('text=login_success')).toBeVisible();
    });
  });

  test.describe('Reports and Analytics', () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto(BASE_URL + '/login');
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should view dashboard analytics', async ({ page }) => {
      await page.goto(BASE_URL + '/dashboard');
      
      // Verify dashboard widgets
      await expect(page.locator('text=Total Students')).toBeVisible();
      await expect(page.locator('text=Consultations This Week')).toBeVisible();
      await expect(page.locator('text=Active Applications')).toBeVisible();
    });

    test('should generate student report', async ({ page }) => {
      await page.goto(BASE_URL + '/reports');
      
      // Select report type
      await page.selectOption('select[name="reportType"]', 'student-summary');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report
      await page.waitForLoadState('networkidle');
      
      // Verify report content
      await expect(page.locator('table')).toBeVisible();
    });

    test('should export data', async ({ page }) => {
      await page.goto(BASE_URL + '/reports');
      
      // Click export button
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Export to CSV")')
      ]);
      
      // Verify download
      expect(download).toBeTruthy();
    });
  });

  test.describe('File Uploads', () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto(BASE_URL + '/login');
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should upload student resume', async ({ page }) => {
      // Navigate to a student's profile
      await page.goto(BASE_URL + '/students');
      await page.click(`text=${TEST_STUDENT.firstName} ${TEST_STUDENT.lastName}`);
      
      // Click upload resume button
      await page.click('button:has-text("Upload Resume")');
      
      // Create a test file
      const testFile = Buffer.from('Test resume content');
      await page.setInputFiles('input[type="file"]', {
        name: 'test-resume.pdf',
        mimeType: 'application/pdf',
        buffer: testFile
      });
      
      // Upload
      await page.click('button:has-text("Upload")');
      
      // Verify upload success
      await expect(page.locator('text=Resume uploaded successfully')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should enforce rate limiting', async ({ page }) => {
      // Try multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.goto(BASE_URL + '/login');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
      }
      
      // Should show rate limit error
      await expect(page.locator('text=Too many attempts')).toBeVisible();
    });

    test('should require authentication for protected routes', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto(BASE_URL + '/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(BASE_URL + '/login');
      
      // Login should still work
      await page.fill('input[type="email"]', MASTER_CREDENTIALS.email);
      await page.fill('input[type="password"]', MASTER_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard');
      
      // Mobile menu should be visible
      await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();
    });
  });

  // Cleanup after tests
  test.afterAll(async ({ request }) => {
    // You might want to clean up test data here
    console.log('Tests completed');
  });
});