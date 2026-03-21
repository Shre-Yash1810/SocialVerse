const axios = require('axios');

async function testConnection() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@test.com',
      password: 'wrong_password'
    });
    console.log('Response state:', res.status);
    console.log('Response data:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Response state:', err.response.status);
      console.log('Response data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testConnection();
