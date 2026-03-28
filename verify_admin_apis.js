const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_socialverse_token_2026_!@#';

const verifyAdminAPIs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      userid: String,
      role: String
    }));

    const founder = await User.findOne({ userid: 'sxturn' });
    const regularUser = await User.findOne({ userid: 'jupiter_explorer' }) || await User.findOne({ userid: { $ne: 'sxturn' } });

    if (!founder) {
      console.error('Founder user not found');
      process.exit(1);
    }

    const founderToken = jwt.sign({ id: founder._id }, JWT_SECRET, { expiresIn: '1h' });
    const userToken = regularUser ? jwt.sign({ id: regularUser._id }, JWT_SECRET, { expiresIn: '1h' }) : null;

    const apiBase = 'http://localhost:5000/api/admin';

    console.log('\n--- Testing Admin Stats (As Founder) ---');
    try {
      const statsRes = await axios.get(`${apiBase}/stats`, {
        headers: { Authorization: `Bearer ${founderToken}` }
      });
      console.log('Stats Response:', statsRes.data);
    } catch (err) {
      console.error('Stats Failed:', err.response?.data || err.message);
    }

    console.log('\n--- Testing Admin Users (As Founder) ---');
    try {
      const usersRes = await axios.get(`${apiBase}/users`, {
        headers: { Authorization: `Bearer ${founderToken}` }
      });
      console.log('Users Count:', usersRes.data.length);
    } catch (err) {
      console.error('Users Failed:', err.response?.data || err.message);
    }

    if (userToken) {
      console.log('\n--- Testing Admin Stats (As Regular User) - SHOULD FAIL ---');
      try {
        await axios.get(`${apiBase}/stats`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('UNEXPECTED SUCCESS: Regular user accessed admin stats');
      } catch (err) {
        console.log('Access Denied (Expected):', err.response?.status, err.response?.data);
      }
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
};

verifyAdminAPIs();
