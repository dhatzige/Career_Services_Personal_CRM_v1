const axios = require('axios');

async function testEnhancedAuth() {
  const client = axios.create({
    baseURL: 'http://localhost:4001/api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await client.get('/health');
    console.log('Health status:', health.data.status);
    
    // Test auth/me without token (should fail)
    console.log('\n2. Testing auth/me without token...');
    try {
      await client.get('/auth/me');
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }
    
    // Test login
    console.log('\n3. Testing login with master account...');
    const loginData = {
      email: 'dhatzige@act.edu',
      password: '!)DQeop4'
    };
    
    console.log('Sending:', loginData);
    const loginResponse = await client.post('/auth/login', loginData);
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.data?.session) {
      const { session } = loginResponse.data.data;
      
      // Test authenticated endpoint
      console.log('\n4. Testing authenticated endpoint...');
      const meResponse = await client.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      console.log('Current user:', JSON.stringify(meResponse.data, null, 2));
      
      // Test getting users (admin/master only)
      console.log('\n5. Testing user management endpoint...');
      try {
        const usersResponse = await client.get('/users', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        console.log('Users:', JSON.stringify(usersResponse.data, null, 2));
      } catch (error) {
        console.log('User management error:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('\nError details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.status === 429) {
      console.error('\nRate limited! Wait 15 minutes before trying again.');
    }
  }
}

testEnhancedAuth();