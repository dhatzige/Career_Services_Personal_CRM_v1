import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // Log errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });
  
  try {
    // Step 1: Login
    console.log('STEP 1: Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'dhatzige@act.edu');
    await page.fill('input[type="password"]', '!)DQeop4');
    await page.screenshot({ path: '01-login-filled.png' });
    
    await page.click('button:has-text("Sign In")');
    console.log('Clicked Sign In');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Successfully logged in!');
    await page.screenshot({ path: '02-dashboard.png' });
    
    // Step 2: Go to Students
    console.log('STEP 2: Going to Students page...');
    await page.click('a:has-text("Students")');
    await page.waitForURL('**/students');
    await page.screenshot({ path: '03-students-page.png' });
    
    // Step 3: Add a student if none exist
    const noStudents = await page.isVisible('text=No students found');
    if (noStudents) {
      console.log('STEP 3: No students, adding one...');
      await page.click('button:has-text("Add Student")');
      await page.waitForTimeout(1000);
      
      // Fill form
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@university.edu');
      await page.screenshot({ path: '04-add-student-form.png' });
      
      // Click the submit button (not the "Save & Add Another")
      const buttons = await page.$$('button:has-text("Add Student")');
      console.log(`Found ${buttons.length} Add Student buttons`);
      if (buttons.length > 1) {
        await buttons[1].click(); // Click the second one (the submit button)
      }
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '05-after-add-student.png' });
    }
    
    // Step 4: Switch to Table view
    console.log('STEP 4: Switching to Table view...');
    const tableButton = await page.$('button:has-text("Table")');
    if (tableButton) {
      await tableButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '06-table-view.png' });
      
      // Step 5: Test dropdowns
      console.log('STEP 5: Testing dropdowns in table...');
      const firstRow = await page.$('tbody tr:first-child');
      if (firstRow) {
        // Test Quick Note dropdown
        console.log('Testing Quick Note dropdown...');
        const quickNoteButton = await firstRow.$('td:nth-child(3) button');
        if (quickNoteButton) {
          await quickNoteButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: '07-quick-note-dropdown.png' });
          
          // Check if dropdown is visible
          const dropdownItems = await page.$$('button:has-text("General Note")');
          console.log(`Quick Note dropdown items found: ${dropdownItems.length}`);
          
          if (dropdownItems.length > 0) {
            await dropdownItems[0].click();
            console.log('Clicked General Note');
            await page.waitForTimeout(2000);
          }
          
          await page.screenshot({ path: '08-after-quick-note.png' });
        }
        
        // Test Attendance dropdown
        console.log('Testing Attendance dropdown...');
        const attendanceButton = await firstRow.$('td:nth-child(4) button');
        if (attendanceButton) {
          await attendanceButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: '09-attendance-dropdown.png' });
          
          // Check if dropdown is visible
          const attendedButton = await page.$('button:has-text("Attended")');
          if (attendedButton) {
            console.log('Found Attended button');
            await attendedButton.click();
            await page.waitForTimeout(2000);
          }
          
          await page.screenshot({ path: '10-after-attendance.png' });
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: '11-final-state.png', fullPage: true });
    console.log('Test complete! Check the screenshots.');
    
  } catch (error) {
    console.error('TEST FAILED:', error);
    await page.screenshot({ path: 'error-state.png' });
  }
  
  // Keep browser open
  console.log('Keeping browser open for inspection...');
  await page.waitForTimeout(60000);
  await browser.close();
})();