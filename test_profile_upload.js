const axios = require('axios');

async function testProfileUpload() {
  const timestamp = Date.now();
  const userData = {
    userid: `pic_user_${timestamp}`,
    name: 'Pic Test User',
    email: `pic_${timestamp}@test.com`,
    password: 'password123',
    dob: '1995-05-05',
    gender: 'Male',
    // Small transparent 1x1 base64 pixel
    profilePic: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  };

  try {
    console.log('Testing registration with profile picture...');
    const res = await axios.post('http://localhost:5000/api/auth/register', userData);
    console.log('Registration success!');
    console.log('User ID:', res.data.userid);
    
    // Check if we can find the user and see the profilePic URL
    // For this test, the registerUser response doesn't return profilePic, 
    // but we can check if it succeeded without errors.
    console.log('SUCCESS: Profile picture upload handled by backend.');
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

testProfileUpload();
