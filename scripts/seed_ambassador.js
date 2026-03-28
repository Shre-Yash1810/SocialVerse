const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialverseadmin:yash2831@cluster0.ae5lvci.mongodb.net/?appName=Cluster0';

const UserSchema = new mongoose.Schema({
  userid: String,
  name: String,
  email: String,
  isVerified: Boolean,
  level: Number,
  xp: Number,
  bio: String,
  badges: [String],
  followersCount: Number,
  followingCount: Number,
  postsCount: Number
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const handle = 'nebula_voyager';
    const data = {
      userid: handle,
      name: 'Astra Voyager',
      email: 'astra@socialverse.app',
      isVerified: true,
      level: 22,
      xp: 5800000,
      bio: 'Pioneer of the SocialVerse 🌌 | Digital Alchemist | Chasing the Great Attractor.',
      badges: [
        'THE RISING STAR',
        'THE GREAT ATTRACTOR',
        'THE SUPERNOVA MOMENT',
        'THE LORD OF RINGS',
        'THE COSMIC VOYAGER'
      ],
      followersCount: 12400,
      followingCount: 482,
      postsCount: 124
    };

    const existing = await User.findOne({ userid: handle });
    if (existing) {
      console.log('Updating existing ambassador...');
      Object.assign(existing, data);
      await existing.save();
    } else {
      console.log('Creating new ambassador...');
      await User.create(data);
    }

    console.log('Seeding successful!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
