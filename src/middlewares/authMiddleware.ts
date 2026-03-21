import jwt from 'jsonwebtoken';
import { Response, Request, NextFunction } from 'express';
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

      if (decoded.id.startsWith('mock_')) {
        (req as any).user = {
          _id: decoded.id,
          name: 'Mock User',
          email: 'mock@example.com',
          userid: 'mock_user'
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
