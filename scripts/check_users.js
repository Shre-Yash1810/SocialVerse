const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const mongoURI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(mongoURI);
  const User = mongoose.model('User', new mongoose.Schema({ userid: String }));
  const users = await User.find({}).select('userid');
  console.log('Current UserIDs:', users.map(u => u.userid));
  process.exit(0);
}

check();
