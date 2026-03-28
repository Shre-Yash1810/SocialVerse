const mongoose = require('mongoose');
require('dotenv').config();

const promoteToFounder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
      userid: String,
      role: { type: String, enum: ['user', 'admin', 'founder'], default: 'user' }
    });
    const User = mongoose.model('User', UserSchema);

    const userid = 'sxturn'; // Promoting sxturn to founder
    const user = await User.findOne({ userid });
    
    if (!user) {
      console.log(`User ${userid} not found`);
      process.exit(1);
    }

    user.role = 'founder';
    await user.save();
    console.log(`User ${userid} promoted to founder successfully`);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error promoting user:', err);
    process.exit(1);
  }
};

promoteToFounder();
