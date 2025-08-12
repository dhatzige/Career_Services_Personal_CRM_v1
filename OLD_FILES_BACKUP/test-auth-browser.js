const axios = require('axios');

async function testAuth() {
  try {
    // Test login with browser-like headers
    console.log('Testing login with master account...');
    const loginResponse = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'dhatzige@act.edu',
      password: '!)DQeop4'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    const { session } = loginResponse.data.data;
    
    // Test authenticated endpoint
    console.log('\nTesting authenticated endpoint...');
    const meResponse = await axios.get('http://localhost:4001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Current user:', JSON.stringify(meResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.status === 429) {
      console.error('Rate limited! Wait a few minutes before trying again.');
    }
  }
}

testAuth();