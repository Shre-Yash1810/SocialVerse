const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Moment = require('./src/models/Moment').default;
const User = require('./src/models/User').default;

dotenv.config();

const check = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const moments = await Moment.find().populate('user', 'userid');
        console.log(`Found ${moments.length} moments`);
        moments.forEach(m => {
            console.log(`- User: ${m.user?.userid}, ID: ${m._id}, Created: ${m.createdAt}, Expires: ${m.expiresAt}`);
        });
        
        process.exit(0);
    } catch (e) {
        console.error('Error during check:', e);
        process.exit(1);
    }
};

check();
