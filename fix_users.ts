import mongoose from 'mongoose';
import User from './src/models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const usersWithoutPassword = await User.find({ password: { $exists: false } });
    console.log(`Found ${usersWithoutPassword.length} users without passwords`);

    if (usersWithoutPassword.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash('password123', salt);

      for (const user of usersWithoutPassword) {
        user.password = defaultPassword;
        await user.save();
        console.log(`Updated user: ${user.userid}`);
      }
    }

    console.log('Done fixing users');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing users:', err);
    process.exit(1);
  }
};

fixUsers();
