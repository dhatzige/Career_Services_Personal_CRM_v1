const fetch = require('node-fetch');

// Test the delete API directly
async function testDelete() {
  try {
    // First, check if API is running
    const healthCheck = await fetch('http://localhost:4001/api/health');
    if (!healthCheck.ok) {
      console.log('API server is not running properly');
      return;
    }
    
    console.log('API server is running:', await healthCheck.json());
    
    // Test delete a note (you'll need to replace with actual ID)
    const noteId = 'test-note-id'; // Replace with actual note ID from your database
    console.log(`\nTesting delete note with ID: ${noteId}`);
    
    const deleteResponse = await fetch(`http://localhost:4001/api/students/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await deleteResponse.json();
    console.log('Delete response:', result);
    
  } catch (error) {
    console.error('Error testing delete:', error);
  }
}

testDelete();