const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_socialverse_token_2026_!@#';

const verifyGetMe = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({ userid: String }));
    const user = await User.findOne({ userid: 'sxturn' });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    
    const res = await axios.get('http://localhost:5000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('User Profile Fetch Result:', res.status, res.data.userid);
    mongoose.connection.close();
  } catch (err) {
    console.error('Fetch Failed:', err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }
};

verifyGetMe();
