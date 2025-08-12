const axios = require('axios');

async function testStudentManagement() {
  const client = axios.create({
    baseURL: 'http://localhost:4001/api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });

  try {
    // 1. Login first
    console.log('1. Logging in with master account...');
    const loginResponse = await client.post('/auth/login', {
      email: 'dhatzige@act.edu',
      password: '!)DQeop4'
    });
    
    const { session } = loginResponse.data.data;
    console.log('✅ Login successful!');
    
    // Add auth header for subsequent requests
    client.defaults.headers['Authorization'] = `Bearer ${session.access_token}`;
    
    // 2. Get current user
    console.log('\n2. Getting current user info...');
    const meResponse = await client.get('/auth/me');
    console.log('Current user:', meResponse.data.data.user);
    
    // 3. Create a test student
    console.log('\n3. Creating a test student...');
    const newStudent = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      yearOfStudy: 'junior',
      major: 'Computer Science',
      status: 'active'
    };
    
    const createResponse = await client.post('/students', newStudent);
    console.log('✅ Student created:', createResponse.data.data);
    const studentId = createResponse.data.data.id;
    
    // 4. Get all students
    console.log('\n4. Getting all students...');
    const studentsResponse = await client.get('/students');
    console.log(`Found ${studentsResponse.data.data.length} students`);
    
    // 5. Get specific student
    console.log('\n5. Getting specific student...');
    const studentResponse = await client.get(`/students/${studentId}`);
    console.log('Student details:', studentResponse.data.data);
    
    // 6. Update student
    console.log('\n6. Updating student...');
    const updateData = {
      yearOfStudy: 'senior',
      careerInterests: ['Software Engineering', 'Data Science']
    };
    const updateResponse = await client.put(`/students/${studentId}`, updateData);
    console.log('✅ Student updated:', updateResponse.data.data);
    
    // 7. Add a note
    console.log('\n7. Adding a note to student...');
    const noteData = {
      content: 'Had a great consultation about internship opportunities.',
      type: 'consultation',
      isPrivate: false
    };
    const noteResponse = await client.post(`/notes/student/${studentId}`, noteData);
    console.log('✅ Note added:', noteResponse.data.data);
    
    // 8. Delete the test student
    console.log('\n8. Deleting test student...');
    const deleteResponse = await client.delete(`/students/${studentId}`);
    console.log('✅ Student deleted');
    
    console.log('\n✅ All student management operations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 429) {
      console.error('Rate limited! Wait before trying again.');
    }
  }
}

testStudentManagement();