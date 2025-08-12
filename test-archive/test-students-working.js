import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const page = await browser.newPage();
  
  // Log errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });
  
  try {
    // Go to app - should auto redirect to login or dashboard
    console.log('1. Going to app...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    if (page.url().includes('login')) {
      console.log('2. Need to login...');
      await page.fill('input[type="email"]', 'dhatzige@act.edu');
      await page.fill('input[type="password"]', '!)DQeop4');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // We should be on dashboard now
    console.log('3. On dashboard, going to Students...');
    await page.click('text=Students');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '01-students-page.png' });
    
    // Add student using the dashboard button if no students
    const addFirstButton = await page.$('button:has-text("Add Your First Student")');
    if (addFirstButton) {
      console.log('4. No students, clicking Add Your First Student...');
      await addFirstButton.click();
      await page.waitForTimeout(1000);
      
      // Fill the form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Student');
      await page.fill('input[name="email"]', 'test.student@act.edu');
      await page.screenshot({ path: '02-add-form.png' });
      
      // Find the actual submit button (not "Save & Add Another")
      const submitButtons = await page.$$('button');
      for (const button of submitButtons) {
        const text = await button.textContent();
        if (text === 'Add Student' && !text.includes('Save')) {
          console.log('5. Clicking Add Student button...');
          await button.click();
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '03-after-add.png' });
    }
    
    // Now we should have at least one student, switch to table view
    console.log('6. Switching to Table view...');
    const tableButton = await page.$('button:has-text("Table")');
    if (tableButton) {
      await tableButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '04-table-view.png' });
      
      // Find the first row
      const firstRow = await page.$('tbody tr');
      if (firstRow) {
        console.log('7. Found student row, testing Quick Note dropdown...');
        
        // Find the Quick Note cell (3rd column)
        const cells = await firstRow.$$('td');
        if (cells.length >= 3) {
          const quickNoteCell = cells[2];
          const quickNoteButton = await quickNoteCell.$('button');
          
          if (quickNoteButton) {
            console.log('8. Clicking Quick Note button...');
            await quickNoteButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: '05-quick-note-dropdown.png' });
            
            // Look for dropdown in the document body (it might be portaled)
            const dropdownOptions = await page.$$('body button:has-text("General Note")');
            console.log(`Found ${dropdownOptions.length} dropdown options`);
            
            if (dropdownOptions.length > 0) {
              console.log('9. Clicking General Note...');
              await dropdownOptions[0].click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: '06-after-note.png' });
            } else {
              // Try different selector
              const anyDropdown = await page.$$('body > div > div button');
              console.log(`Found ${anyDropdown.length} buttons in portal divs`);
            }
          }
        }
        
        // Test attendance dropdown
        if (cells.length >= 4) {
          console.log('10. Testing Attendance dropdown...');
          const attendanceCell = cells[3];
          const attendanceButton = await attendanceCell.$('button');
          
          if (attendanceButton) {
            await attendanceButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: '07-attendance-dropdown.png' });
            
            const attendedOption = await page.$('body button:has-text("Attended")');
            if (attendedOption) {
              console.log('11. Clicking Attended...');
              await attendedOption.click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: '08-after-attendance.png' });
            }
          }
        }
      }
    }
    
    console.log('Test complete! Check the screenshots.');
    
  } catch (error) {
    console.error('TEST ERROR:', error);
    await page.screenshot({ path: 'test-error.png' });
  }
  
  await page.waitForTimeout(30000);
  await browser.close();
})();