const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8']);

const UserSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  password: { type: String }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
