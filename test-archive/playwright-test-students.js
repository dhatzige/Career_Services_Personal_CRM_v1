import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:5173');
  
  // Login
  console.log('2. Logging in...');
  await page.fill('input[type="email"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('3. Logged in successfully!');
  
  // Navigate to students page
  console.log('4. Navigating to students page...');
  await page.click('a[href="/students"]');
  await page.waitForURL('**/students');
  
  // Switch to table view
  console.log('5. Switching to table view...');
  await page.waitForSelector('button:has-text("Table")', { timeout: 5000 });
  await page.click('button:has-text("Table")');
  
  // Wait for table to load
  await page.waitForSelector('table', { timeout: 5000 });
  console.log('6. Table view loaded!');
  
  // Find the first student row and try to interact with dropdowns
  console.log('7. Finding student rows...');
  const studentRows = await page.$$('tbody tr');
  console.log(`Found ${studentRows.length} student rows`);
  
  if (studentRows.length > 0) {
    console.log('8. Testing Quick Note dropdown...');
    // Find and click the Quick Note dropdown (third column)
    const quickNoteCell = await studentRows[0].$('td:nth-child(3)');
    if (quickNoteCell) {
      const quickNoteButton = await quickNoteCell.$('button');
      if (quickNoteButton) {
        console.log('9. Clicking Quick Note dropdown...');
        await quickNoteButton.click();
        await page.waitForTimeout(1000);
        
        // Check if dropdown opened
        const dropdownVisible = await page.isVisible('[role="menu"]');
        console.log(`Quick Note dropdown visible: ${dropdownVisible}`);
        
        if (dropdownVisible) {
          // Try to click a note type
          console.log('10. Trying to select a note type...');
          await page.click('text="General Note"');
          await page.waitForTimeout(2000);
        }
      }
    }
    
    console.log('11. Testing Attendance dropdown...');
    // Find and click the Attendance dropdown (fourth column)
    const attendanceCell = await studentRows[0].$('td:nth-child(4)');
    if (attendanceCell) {
      const attendanceButton = await attendanceCell.$('button');
      if (attendanceButton) {
        console.log('12. Clicking Attendance dropdown...');
        await attendanceButton.click();
        await page.waitForTimeout(1000);
        
        // Check if dropdown opened
        const dropdownVisible = await page.isVisible('[role="menu"]');
        console.log(`Attendance dropdown visible: ${dropdownVisible}`);
        
        if (dropdownVisible) {
          // Try to click attended
          console.log('13. Trying to mark as attended...');
          await page.click('text="Attended"');
          await page.waitForTimeout(2000);
        }
      }
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: 'students-table-test.png', fullPage: true });
  console.log('14. Screenshot saved as students-table-test.png');
  
  // Check for any errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Keep browser open for manual inspection
  console.log('Test complete. Browser will stay open for inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();