import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log all console messages
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    console.log('STEP 1: Going to localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.screenshot({ path: 'step1-initial-page.png' });
    console.log('Screenshot saved: step1-initial-page.png');
    
    // Wait a bit to see what's on the page
    await page.waitForTimeout(2000);
    
    // Check if we're already logged in by looking for dashboard elements
    const isDashboard = await page.url().includes('dashboard');
    if (isDashboard) {
      console.log('Already logged in! Skipping login...');
    } else {
      console.log('Need to login...');
      // Take screenshot before login
      await page.screenshot({ path: 'step2-login-page.png' });
      
      // Check if login form exists
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        console.log('Found email input, filling login form...');
        await page.fill('input[type="email"]', 'dhatzige@act.edu');
        await page.fill('input[type="password"]', '!)DQeop4');
        await page.screenshot({ path: 'step3-login-filled.png' });
        
        await page.click('button[type="submit"]');
        console.log('Clicked submit button');
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'step4-after-login.png' });
      }
    }
    
    // Now navigate to students
    console.log('STEP 5: Current URL:', page.url());
    console.log('Going to students page...');
    
    // Try to find students link
    const studentsLink = await page.$('a[href="/students"]');
    if (studentsLink) {
      await studentsLink.click();
      console.log('Clicked students link');
    } else {
      console.log('No students link found, navigating directly...');
      await page.goto('http://localhost:5173/students');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step6-students-page.png' });
    console.log('Screenshot saved: step6-students-page.png');
    
    // Check if table button exists
    console.log('STEP 7: Looking for Table button...');
    const tableButton = await page.$('button:has-text("Table")');
    if (tableButton) {
      console.log('Found Table button, clicking...');
      await tableButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'step7-table-view.png' });
    } else {
      console.log('No Table button found');
    }
    
    // Look for table
    console.log('STEP 8: Looking for table...');
    const table = await page.$('table');
    if (table) {
      console.log('Found table!');
      
      // Get all rows
      const rows = await page.$$('tbody tr');
      console.log(`Found ${rows.length} student rows`);
      
      if (rows.length > 0) {
        // Take screenshot of table
        await page.screenshot({ path: 'step8-table-with-students.png' });
        
        // Find Quick Note button in first row
        console.log('STEP 9: Looking for Quick Note dropdown in first row...');
        const firstRow = rows[0];
        
        // Get all cells in the row
        const cells = await firstRow.$$('td');
        console.log(`Row has ${cells.length} cells`);
        
        // Quick Note should be in 3rd cell (index 2)
        if (cells.length > 2) {
          const quickNoteCell = cells[2];
          const quickNoteButton = await quickNoteCell.$('button');
          
          if (quickNoteButton) {
            console.log('Found Quick Note button, clicking...');
            await quickNoteButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'step9-quick-note-clicked.png' });
            
            // Check what's visible now
            const dropdownMenu = await page.$('[role="menu"]');
            if (dropdownMenu) {
              console.log('Dropdown menu appeared!');
              const menuItems = await page.$$('[role="menuitem"]');
              console.log(`Found ${menuItems.length} menu items`);
            } else {
              console.log('No dropdown menu found after click');
              // Try other selectors
              const anyDropdown = await page.$$('.absolute.z-50');
              console.log(`Found ${anyDropdown.length} absolute positioned elements`);
            }
          } else {
            console.log('No button found in Quick Note cell');
          }
        }
        
        // Try Attendance dropdown
        console.log('STEP 10: Looking for Attendance dropdown...');
        if (cells.length > 3) {
          const attendanceCell = cells[3];
          const attendanceButton = await attendanceCell.$('button');
          
          if (attendanceButton) {
            console.log('Found Attendance button, clicking...');
            await attendanceButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'step10-attendance-clicked.png' });
          } else {
            console.log('No button found in Attendance cell');
          }
        }
      }
    } else {
      console.log('No table found on page');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('Final screenshot saved');
    
  } catch (error) {
    console.error('ERROR:', error);
    await page.screenshot({ path: 'error-state.png' });
  }
  
  console.log('Test complete. Closing in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();