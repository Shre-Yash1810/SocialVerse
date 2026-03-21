import User from '../models/User';
import Post from '../models/Post';
import Moment from '../models/Moment';
import Chat from '../models/Chat';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SYSTEM_USER_ID = 'socialverse_guide';

export const seedInitialData = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // Check if system user exists
    let systemUser = await User.findOne({ userid: SYSTEM_USER_ID });
    
    if (!systemUser) {
      console.log('Seeding: Creating system user...');
      systemUser = await User.create({
        userid: SYSTEM_USER_ID,
        name: 'SocialVerse Guide',
        email: 'guide@socialverse.app',
        password: defaultPassword,
        dob: new Date('2000-01-01'),
        bio: 'I am here to help you navigate the SocialVerse! 🚀',
        profilePic: 'https://ui-avatars.com/api/?name=SocialVerse+Guide&background=0D8ABC&color=fff&size=512',
        isDiscoveryEnabled: true,
      });
    }

    // Check if there are any posts
    const postCount = await Post.countDocuments();
    
    if (postCount === 0) {
      console.log('Seeding: Creating initial welcome post...');
      await Post.create({
        author: systemUser._id,
        type: 'Image',
        content: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop',
        caption: 'Welcome to SocialVerse! 🌟 This is your first step into a world of limitless connection. Try liking this post, adding a comment, or sharing it with others. Most importantly, go to your profile and share your own story! #SocialVerse #NewBeginnings',
        hashtags: ['SocialVerse', 'NewBeginnings'],
        likes: [],
        savedBy: [],
        commentsCount: 0,
        sharesCount: 0,
      });
      console.log('Seeding: Success!');
    }

    // Seed mock users if count is low
    const userCount = await User.countDocuments();
    if (userCount < 5) {
      console.log('Seeding: Creating more mock users...');
      const mockUsers = [
        { userid: 'jupiter_explorer', name: 'Jupiter', email: 'j@sv.app', dob: new Date(), profilePic: 'https://ui-avatars.com/api/?name=Jupiter' },
        { userid: 'mars_rover', name: 'Mars', email: 'm@sv.app', dob: new Date(), profilePic: 'https://ui-avatars.com/api/?name=Mars' },
        { userid: 'venus_vibe', name: 'Venus', email: 'v@sv.app', dob: new Date(), profilePic: 'https://ui-avatars.com/api/?name=Venus' }
      ];
      await User.insertMany(mockUsers);
    }

    // Seed mock moments if empty
    const momentCount = await Moment.countDocuments();
    if (momentCount === 0) {
      console.log('Seeding: Creating mock moments...');
      const users = await User.find({ userid: { $ne: SYSTEM_USER_ID } }).limit(3);
      for (const u of users) {
        await Moment.create({
          user: u._id,
          media: 'https://images.unsplash.com/photo-1614732414444-af963b81f392?q=80', // Space-like image
          type: 'image'
        });
      }
    }

    // Seed mock chats if empty
    const chatCount = await Chat.countDocuments();
    if (chatCount === 0) {
      console.log('Seeding: Creating mock chats...');
      const users = await User.find().limit(3);
      if (users.length >= 2) {
        // Single Chat
        await Chat.create({
          participants: [users[0]._id, users[1]._id],
          isGroup: false
        });
        // Group Chat
        await Chat.create({
          participants: users.map(u => u._id),
          isGroup: true,
          name: 'SocialVerse Explorers'
        });
      }
    }
  } catch (error) {
    console.error('Seeding failed:', error);
  }
};
