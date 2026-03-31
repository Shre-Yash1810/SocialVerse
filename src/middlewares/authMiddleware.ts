import jwt from 'jsonwebtoken';
import { Response, Request, NextFunction } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';

export const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, secret) as { id: string };

      if (decoded.id.startsWith('mock_') || mongoose.connection.readyState !== 1) {
        (req as any).user = {
          _id: decoded.id || 'mock_user_123',
          name: 'Mock User',
          email: 'mock@example.com',
          userid: 'mock_user',
          role: 'user',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          xp: 0,
          level: 1,
          following: []
        };
      } else {
        (req as any).user = await User.findById(decoded.id).select('-password');
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && (user.role === 'admin' || user.role === 'founder')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export const isFounder = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === 'founder') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a founder' });
  }
};
