const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Connecting to:', uri);

mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
