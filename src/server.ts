import { httpServer } from './app';
import connectDB from './config/db';
import { seedInitialData } from './services/SeederService';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();
  
  // Seed initial data if necessary
  await seedInitialData();

  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

// trigger restart

// trigger seed

// refresh demo

// finalize chat
