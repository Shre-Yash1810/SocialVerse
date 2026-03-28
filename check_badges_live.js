const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
  userid: String,
  badges: [String],
  selectedBadges: [String]
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const u = await User.findOne({userid: 'nebula_voyager'});
    if (u) {
      console.log('User Found:', u.userid);
      console.log('Badges:', u.badges);
      console.log('Selected:', u.selectedBadges);
    } else {
      console.log('User nebula_voyager not found');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
