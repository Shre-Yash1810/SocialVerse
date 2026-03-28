import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Report from '../models/Report';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from '../services/socketService';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const blockUser = async (req: Request, res: Response) => {
  const { targetId } = req.params;
  if (typeof targetId !== 'string') return res.status(400).json({ message: 'Invalid target ID' });
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.json({ message: 'User blocked (Mock Mode)', targetId });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.blockedUsers.some(id => id.toString() === targetId)) {
      user.blockedUsers.push(new mongoose.Types.ObjectId(targetId));
      await user.save();
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  const { targetId } = req.params;
  if (typeof targetId !== 'string') return res.status(400).json({ message: 'Invalid target ID' });
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.json({ message: 'User unblocked (Mock Mode)', targetId });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== targetId
    );
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const reportUser = async (req: Request, res: Response) => {
  const { targetId, reason } = req.body;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.status(201).json({ message: 'User reported (Mock Mode)', targetId, reason });
  }

  try {
    const report = await Report.create({
      reporter: userId,
      targetType: 'User',
      target: targetId,
      reason,
    });

    res.status(201).json({ message: 'User reported successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const followUser = async (req: Request, res: Response) => {
  const { targetId } = req.params;
  if (typeof targetId !== 'string') return res.status(400).json({ message: 'Invalid target ID' });
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json({ message: 'User followed (Mock Mode)' });

  try {
    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(userId);

    if (!targetUser || !currentUser) return res.status(404).json({ message: 'User not found' });

    if (!currentUser.following.some(id => id.toString() === targetId)) {
      currentUser.following.push(new mongoose.Types.ObjectId(targetId));
      currentUser.followingCount += 1;
      await currentUser.save();

      targetUser.followers.push(new mongoose.Types.ObjectId(userId));
      targetUser.followersCount += 1;
      await targetUser.save();

      const notification = await Notification.create({
        recipient: new mongoose.Types.ObjectId(targetId as string),
        sender: userId,
        type: 'FOLLOW'
      });
      sendRealTimeNotification(targetId as string, notification);
    }

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  const { targetId } = req.params;
  if (typeof targetId !== 'string') return res.status(400).json({ message: 'Invalid target ID' });
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json({ message: 'User unfollowed (Mock Mode)' });

  try {
    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(userId);

    if (!targetUser || !currentUser) return res.status(404).json({ message: 'User not found' });

    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
    currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
    await currentUser.save();

    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId.toString());
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
    await targetUser.save();

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (isMockMode()) return res.json([{ userid: 'alex123', name: 'Alex' }]);

  try {
    const users = await User.find({
      $or: [
        { userid: { $regex: q as string, $options: 'i' } },
        { name: { $regex: q as string, $options: 'i' } }
      ]
    }).select('userid name profilePic followersCount followingCount');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const { handle } = req.params;

  if (isMockMode()) return res.json({ userid: handle, name: 'Mock User', postsCount: 10 });

  try {
    const lowerCaseHandle = (handle as string).toLowerCase();
    const user = await User.findOne({ userid: lowerCaseHandle })
      .select('-password -blockedUsers')
      .populate('followers', 'userid name profilePic')
      .populate('following', 'userid name profilePic');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { name, bio, pronouns, profilePic, isPrivate } = req.body;

  if (isMockMode()) {
    return res.json({ message: 'Profile updated (Mock Mode)' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    if (profilePic && profilePic.startsWith('data:image')) {
      const CloudinaryService = require('../services/CloudinaryService').default;
      const profilePicUrl = await CloudinaryService.uploadFile(profilePic, 'profile_pics');
      user.profilePic = profilePicUrl;
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export const getMe = async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  try {
    const user = await User.findById(userId).select('-password -blockedUsers');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBlockedUsers = async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json([{ _id: 'mock123', userid: 'spammer', name: 'Spam Bot', profilePic: '' }]);

  try {
    const user = await User.findById(userId).populate('blockedUsers', 'userid name profilePic');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user.blockedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
