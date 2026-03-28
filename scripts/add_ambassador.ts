import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

const seedAmbassador = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const handle = 'nebula_voyager';
    
    // Check if exists
    const existing = await User.findOne({ userid: handle });
    if (existing) {
      console.log('Ambassador already exists. Updating...');
      existing.isVerified = true;
      existing.name = 'Astra Voyager';
      existing.level = 22;
      existing.xp = 5800000;
      existing.bio = 'Pioneer of the SocialVerse 🌌 | Digital Alchemist | Chasing the Great Attractor.';
      existing.badges = [
        'THE RISING STAR',
        'THE GREAT ATTRACTOR',
        'THE SUPERNOVA MOMENT',
        'THE LORD OF RINGS',
        'THE COSMIC VOYAGER'
      ];
      await existing.save();
      console.log('Ambassador updated successfully');
    } else {
      const ambassador = new User({
        userid: handle,
        name: 'Astra Voyager',
        email: 'astra@socialverse.app',
        dob: new Date('1995-05-15'),
        bio: 'Pioneer of the SocialVerse 🌌 | Digital Alchemist | Chasing the Great Attractor.',
        level: 22,
        xp: 5800000,
        role: 'user',
        isVerified: true,
        badges: [
          'THE RISING STAR',
          'THE GREAT ATTRACTOR',
          'THE SUPERNOVA MOMENT',
          'THE LORD OF RINGS',
          'THE COSMIC VOYAGER'
        ],
        followersCount: 12400,
        followingCount: 482,
        postsCount: 124,
      });

      await ambassador.save();
      console.log('Ambassador created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedAmbassador();
