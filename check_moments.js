const mongoose = require('mongoose');

const URI = "mongodb+srv://socialverseadmin:yash2831@cluster0.ae5lvci.mongodb.net/?appName=Cluster0";

const MomentSchema = new mongoose.Schema({}, { strict: false });
const Moment = mongoose.model('Moment', MomentSchema, 'moments');

const check = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(URI);
        console.log('Connected to DB');
        
        const moments = await Moment.find().lean();
        console.log(`Found ${moments.length} moments`);
        moments.forEach(m => {
            console.log(`- ID: ${m._id}, User: ${m.user}, Created: ${m.createdAt}, Expires: ${m.expiresAt}`);
        });
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
};

check();
