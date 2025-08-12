const axios = require('axios');

async function testAuth() {
  try {
    // Test login
    console.log('Testing login with master account...');
    const loginResponse = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'dhatzige@act.edu',
      password: '!)DQeop4'
    });
    
    console.log('Login successful!');
    console.log('Response:', loginResponse.data);
    
    const { session } = loginResponse.data.data;
    
    // Test authenticated endpoint
    console.log('\nTesting authenticated endpoint...');
    const meResponse = await axios.get('http://localhost:4001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    console.log('Current user:', meResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuth();