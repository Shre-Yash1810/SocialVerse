const mongoose = require('mongoose');

async function purge() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://socialverseadmin:yash2831@cluster0.ae5lvci.mongodb.net/?appName=Cluster0');
    console.log('Connected.');

    // Since we don't want to rely on the model file which might have TS/ESM issues, 
    // we use the collection name directly
    const result = await mongoose.connection.collection('moments').deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} moments.`);

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Purge failed:', error);
    process.exit(1);
  }
}

purge();
