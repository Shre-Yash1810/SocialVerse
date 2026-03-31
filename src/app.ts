import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import { registerUserSocket, removeUserSocket, initSocket } from './services/socketService';

// Routes
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import discoveryRoutes from './routes/discoveryRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import commentRoutes from './routes/commentRoutes';
import userRoutes from './routes/userRoutes';
import momentRoutes from './routes/momentRoutes';
import adminRoutes from './routes/adminRoutes';
import feedbackRoutes from './routes/feedbackRoutes';


const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  'https://social-verse-chi.vercel.app',
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // In development, be more permissive with origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true // Support older clients if any
});

initSocket(io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);


app.get('/', (req, res) => {
  res.send('SocialVerse API is running...');
});

// Error Logger Middleware removed

import User from './models/User';

// Socket.io connection
io.on('connection', (socket) => {
  let currentUserId: string | null = null;

  socket.on('register', async (userId: string) => {
    currentUserId = userId;
    console.log(`User ${userId} registering socket ${socket.id}`);
    registerUserSocket(userId, socket.id);
    
    // Update lastSeen on register
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (err) {
      console.error('Error updating lastSeen on register:', err);
    }
  });

  socket.on('heartbeat', async (userId: string) => {
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (err) {
      // Silent fail for heartbeat
    }
  });

  socket.on('disconnect', async (reason) => {
    removeUserSocket(socket.id);
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    
    if (currentUserId) {
      try {
        await User.findByIdAndUpdate(currentUserId, { lastSeen: new Date() });
      } catch (err) {
        console.error('Error updating lastSeen on disconnect:', err);
      }
    }
  });
});

export { app, httpServer, io };
