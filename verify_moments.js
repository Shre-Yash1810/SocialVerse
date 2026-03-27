const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Moment = require('./src/models/Moment').default;
  const User = require('./src/models/User').default;
  const Notification = require('./src/models/Notification').default;
  const Message = require('./src/models/Message').default;

  const testUser = await User.findOne({ userid: 'jupiter_explorer' });
  const targetUser = await User.findOne({ userid: 'mars_rover' });

  if (!testUser || !targetUser) {
    console.log('Test users not found');
    process.exit(1);
  }

  const overlayData = JSON.stringify([{
    id: 'test_overlay',
    text: 'Hello World @mars_rover',
    x: 50,
    y: 50,
    color: '#FFFFFF',
    fontSize: 28,
    isMention: true,
    mentionedUserId: targetUser._id,
    style: 'background',
    fontFamily: 'Modern'
  }]);

  console.log('Creating test moment...');
  const moment = await Moment.create({
    user: testUser._id,
    media: 'https://images.unsplash.com/photo-1614732414444-af963b81f392',
    type: 'image',
    overlayData,
    mentions: [targetUser._id]
  });

  console.log('Moment created:', moment._id);
  console.log('Overlay Data:', moment.overlayData);
  console.log('Mentions:', moment.mentions);

  // Check if saved correctly
  const savedMoment = await Moment.findById(moment._id);
  if (savedMoment.overlayData === overlayData) {
    console.log('SUCCESS: Overlay Data matches');
  } else {
    console.log('FAIL: Overlay Data mismatch');
  }

  process.exit(0);
}

verify();
