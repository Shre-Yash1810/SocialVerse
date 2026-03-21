const axios = require('axios');

async function testDuplicateEmail() {
  const timestamp = Date.now();
  const user1 = {
    userid: `user1_${timestamp}`,
    name: 'User One',
    email: `shared_${timestamp}@test.com`,
    password: 'password123',
    dob: '1990-01-01',
    gender: 'Other'
  };

  const user2 = {
    userid: `user2_${timestamp}`,
    name: 'User Two',
    email: `shared_${timestamp}@test.com`, // Same email
    password: 'password123',
    dob: '1990-01-01',
    gender: 'Other'
  };

  try {
    console.log('Registering user1...');
    const res1 = await axios.post('http://localhost:5000/api/auth/register', user1);
    console.log('User1 registered:', res1.data.userid);

    console.log('Registering user2 (Duplicate Email)...');
    const res2 = await axios.post('http://localhost:5000/api/auth/register', user2);
    console.log('User2 registered:', res2.data.userid);

    console.log('SUCCESS: Duplicate emails allowed.');
  } catch (err) {
    if (err.response) {
      console.error('Registration Failed:', err.response.status);
      console.error('Error Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

testDuplicateEmail();
