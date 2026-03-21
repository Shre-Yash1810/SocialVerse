const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const dropEmailIndex = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const collection = mongoose.connection.collection('users');
    console.log('Checking indices...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Look for unique index on email
    const emailIndex = indexes.find(idx => idx.key && idx.key.email === 1 && idx.unique);
    
    if (emailIndex) {
      console.log(`Dropping index: ${emailIndex.name}`);
      await collection.dropIndex(emailIndex.name);
      console.log('Successfully dropped unique email index.');
    } else {
      console.log('No unique index on email found.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    process.exit(1);
  }
};

dropEmailIndex();
