const axios = require('axios');

async function diag() {
  const token = 'YOUR_TOKEN_HERE'; // I need a token to test protected routes
  // Actually, I can just check of any route that doesn't require auth fails too.
  
  try {
    const res = await axios.get('http://localhost:5000/api/users/me');
    console.log('Users/me response:', res.data);
  } catch (e) {
    console.log('Users/me error:', e.response?.status, e.response?.data);
  }

  try {
    const res = await axios.get('http://localhost:5000/api/moments');
    console.log('Moments response:', res.data);
  } catch (e) {
    console.log('Moments error:', e.response?.status, e.response?.data);
  }
}

// Wait, I don't have a token easily. 
// I'll try a route that might be public or just check if the server is alive.
axios.get('http://localhost:5000/api/chats/test_db')
  .then(res => console.log('Test DB:', res.data))
  .catch(e => console.log('Test DB error:', e.response?.status, e.response?.data));
