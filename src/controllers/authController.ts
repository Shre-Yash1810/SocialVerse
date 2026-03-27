import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
import { generateToken } from '../middlewares/authMiddleware';
import CloudinaryService from '../services/CloudinaryService';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const registerUser = async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.status(503).json({ 
      message: 'Database not connected. Registration is unavailable in Mock Mode.',
      tip: 'Please ensure MongoDB is running and your connection string is correct.'
    });
  }

  try {
    const { userid, name, email, password, dob, pronouns, profilePic } = req.body;
    
    const lowerCaseUserId = userid.toLowerCase();
    const userExists = await User.findOne({ userid: lowerCaseUserId });

    if (userExists) {
      return res.status(400).json({ message: 'User ID already exists' });
    }

    let profilePicUrl = '';
    if (profilePic && profilePic.startsWith('data:image')) {
      try {
        profilePicUrl = await CloudinaryService.uploadFile(profilePic, 'profile_pics');
      } catch (uploadError) {
        console.error('Initial profile pic upload failed, using default');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      userid: lowerCaseUserId,
      name,
      email,
      password: hashedPassword,
      dob,
      pronouns,
      profilePic: profilePicUrl
    });

    if (user) {
      const userObj = user as any; 
      res.status(201).json({
        _id: userObj._id,
        userid: userObj.userid,
        name: userObj.name,
        email: userObj.email,
        profilePic: userObj.profilePic,
        token: generateToken(userObj._id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`Login attempt for: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email/userid and password' });
  }

  if (isMockMode()) {
    return res.status(503).json({ 
      message: 'Database not connected. Login is unavailable in Mock Mode.',
      tip: 'Please ensure MongoDB is running and your connection string is correct.'
    });
  }

  try {
    const lowerCaseEmailOrUserId = email.toLowerCase();
    const user = await User.findOne({ $or: [{ email: lowerCaseEmailOrUserId }, { userid: lowerCaseEmailOrUserId }] });

    if (user && user.password && (await bcrypt.compare(password, user.password as string))) {
      res.json({
        _id: user._id,
        userid: user.userid,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        token: generateToken((user._id as unknown) as string),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
