const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User').default;
  const UserDevice = require('./src/models/UserDevice').default;

  const testUser = await User.findOne({ isDiscoveryEnabled: true });
  if (!testUser) {
    console.log('No discoverable user found in DB');
    process.exit(1);
  }
  console.log(`Using test user: ${testUser.userid}`);

  console.log('Cleaning up old devices for jupiter_explorer...');
  await UserDevice.deleteMany({ user: testUser._id });

  console.log('Simulating Device 1 at [77.0, 28.0]...');
  await UserDevice.create({
    user: testUser._id,
    deviceId: 'device_1',
    location: { type: 'Point', coordinates: [77.0, 28.0] },
    lastSeen: new Date()
  });

  console.log('Simulating Device 2 at [77.1, 28.1]...');
  await UserDevice.create({
    user: testUser._id,
    deviceId: 'device_2',
    location: { type: 'Point', coordinates: [77.1, 28.1] },
    lastSeen: new Date()
  });

  console.log('Search near Device 1 [77.0, 28.0]...');
  // Note: We need another user to search, because getNearbyUsers excludes self.
  const searchUser = await User.findOne({ userid: { $ne: 'jupiter_explorer' } });
  if (!searchUser) {
    console.log('No other user found to perform search');
    process.exit(0);
  }

  // We'll simulate the query logic from discoveryController
  const longitude = 77.0;
  const latitude = 28.0;

  const nearbyDevices = await UserDevice.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: 500
      }
    }
  }).populate('user', 'userid');

  console.log(`Found ${nearbyDevices.length} devices nearby.`);
  nearbyDevices.forEach(d => {
    console.log(`- Device: ${d.deviceId}, User: ${d.user.userid}, Coords: ${d.location.coordinates}`);
  });

  if (nearbyDevices.some(d => d.deviceId === 'device_1' && d.user.userid === 'jupiter_explorer')) {
    console.log('SUCCESS: Device 1 found near its location.');
  }

  process.exit(0);
}

verify();
