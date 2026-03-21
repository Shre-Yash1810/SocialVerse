import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Fix for DNS SRV record resolution issues in some environments
dns.setServers(['8.8.8.8']);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI as string;
    console.log('Attempting to connect to MongoDB...');
    
    if (uri && uri !== 'memory') {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('Running in MOCK MODE: MONGODB_URI is not set or set to "memory"');
    }
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    console.warn('App will continue in MOCK MODE.');
    console.log('TIP: Check your internet/VPN or MongoDB Atlas whitelisting.');
  }
};

export default connectDB;
