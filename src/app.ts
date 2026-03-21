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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

// Middleware
app.use(helmet());
app.use(cors());
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

app.get('/', (req, res) => {
  res.send('SocialVerse API is running...');
});

// Error Logger Middleware removed

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', (userId: string) => {
    registerUserSocket(userId, socket.id);
  });

  socket.on('disconnect', () => {
    removeUserSocket(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

export { app, httpServer, io };
