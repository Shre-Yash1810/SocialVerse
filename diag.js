const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
  console.log('--- Diagnostic Start ---');
  console.log('Node Version:', process.version);
  console.log('Current Directory:', process.cwd());
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI present:', !!mongoUri);
    
    if (mongoUri) {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB successfully.');
      console.log('Connection state:', mongoose.connection.readyState);
    } else {
      console.log('MONGODB_URI is missing from .env');
    }
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
  }

  try {
    console.log('Checking model exports...');
    const Message = require('./src/models/Message').default;
    const Notification = require('./src/models/Notification').default;
    const Moment = require('./src/models/Moment').default;
    const User = require('./src/models/User').default;
    
    console.log('Models loaded successfully.');
    
    if (mongoose.connection.readyState === 1) {
      const userCount = await User.countDocuments();
      console.log('User count:', userCount);
    }
  } catch (err) {
    console.error('Model loading failed:', err.message);
    console.error(err.stack);
  }

  console.log('--- Diagnostic End ---');
  process.exit(0);
}

check();
