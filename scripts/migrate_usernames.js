const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialverse';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected successfully.');

    const User = mongoose.model('User', new mongoose.Schema({
      userid: String
    }));

    console.log('Fetching all users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    let updatedCount = 0;
    for (const user of users) {
      if (user.userid && user.userid !== user.userid.toLowerCase()) {
        const oldId = user.userid;
        const newId = user.userid.toLowerCase();
        
        // Check if lowercase version already exists (to avoid duplicate key error)
        const existing = await User.findOne({ userid: newId, _id: { $ne: user._id } });
        if (existing) {
          console.warn(`[WARNING] Skipping ${oldId} -> ${newId} because ${newId} already exists!`);
          continue;
        }

        user.userid = newId;
        await user.save();
        console.log(`Updated: ${oldId} -> ${newId}`);
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
