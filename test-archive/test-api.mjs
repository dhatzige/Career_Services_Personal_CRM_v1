import fetch from 'node-fetch';

// Test the backend API
async function testAPI() {
  const API_BASE_URL = 'http://localhost:4001/api';
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // You can add more tests here once you have actual IDs from the database
    console.log('\nAPI is working properly!');
    console.log('You can now test the delete functionality from the frontend.');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the backend server is running with: cd server && npm run dev');
  }
}

testAPI();