import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Moment from '../models/Moment';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendRealTimeNotification, sendRealTimeMessage } from '../services/socketService';
import { extractUserIdsFromMentions } from '../utils/mentionUtils';
import CloudinaryService from '../services/CloudinaryService';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const createMoment = async (req: Request, res: Response) => {
  let { media, type, overlayData, mentions } = req.body;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.status(201).json({ message: 'Moment created (Mock Mode)', media, type });
  }

  try {
    // If media is base64, upload to Cloudinary
    if (media && media.startsWith('data:')) {
      media = await CloudinaryService.uploadFile(media, 'moments');
    }

    const moment = await Moment.create({
      user: userId,
      media,
      type: type || 'image',
      overlayData,
      mentions
    });

    // Handle Mentions and DM Sharing using provided mentions from frontend
    const mentionedUserIds = mentions || []; 
    for (const mentionId of mentionedUserIds) {
      if (mentionId.toString() === userId.toString()) continue;

      // 1. Send Notification
      const notif = await Notification.create({
        recipient: mentionId,
        sender: userId,
        type: 'MENTION',
        moment: moment._id
      });
      sendRealTimeNotification(mentionId.toString(), notif);
    }

    res.status(201).json(moment);
  } catch (error) {
    console.error('Create moment error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMoments = async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.json([
      {
        user: { _id: 'u1', userid: 'jupiter_explorer', name: 'Jupiter', profilePic: 'https://ui-avatars.com/api/?name=Jupiter&background=random' },
        moments: [{ _id: 'm1', media: 'https://images.unsplash.com/photo-1614732414444-af963b81f392?q=80', type: 'image' }]
      },
      {
        user: { _id: 'u2', userid: 'mars_rover', name: 'Mars', profilePic: 'https://ui-avatars.com/api/?name=Mars&background=random' },
        moments: [{ _id: 'm2', media: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80', type: 'image' }]
      },
      {
        user: { _id: 'u3', userid: 'venus_vibe', name: 'Venus', profilePic: 'https://ui-avatars.com/api/?name=Venus&background=random' },
        moments: [{ _id: 'm3', media: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80', type: 'image' }]
      }
    ]);
  }

  try {
    // Get moments from followed users + self
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const followingIds = [...currentUser.following, userId];

    // FOR DEMO: Get all recent moments (instead of just following)
    // In production, we would filter by followingIds
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const moments = await Moment.find({
      createdAt: { $gt: yesterday }
    })
      .populate('user', 'userid name profilePic')
      .populate('viewers', 'userid name profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    // Group moments by user for the "Saturn" circles
    const groupedMoments: any = {};
    moments.forEach((m: any) => {
      const uId = m.user._id.toString();
      if (!groupedMoments[uId]) {
        groupedMoments[uId] = {
          user: m.user,
          moments: []
        };
      }
      groupedMoments[uId].moments.push(m);
    });

    res.json(Object.values(groupedMoments));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const markMomentAsViewed = async (req: Request, res: Response) => {
  const { momentId } = req.params;
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json({ message: 'Moment viewed (Mock Mode)' });

  try {
    await Moment.findByIdAndUpdate(momentId, {
      $addToSet: { viewers: userId }
    });
    res.json({ message: 'Moment marked as viewed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteMoment = async (req: Request, res: Response) => {
  const { momentId } = req.params;
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json({ message: 'Moment deleted (Mock Mode)' });

  try {
    const moment = await Moment.findById(momentId);
    if (!moment) return res.status(404).json({ message: 'Moment not found' });

    if (moment.user.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Moment.findByIdAndDelete(momentId);
    res.json({ message: 'Moment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const highlightMoment = async (req: Request, res: Response) => {
  const { momentId } = req.params;
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json({ message: 'Moment highlighted (Mock Mode)' });

  try {
    const moment = await Moment.findById(momentId);
    if (!moment) return res.status(404).json({ message: 'Moment not found' });

    if (moment.user.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updated = await Moment.findByIdAndUpdate(momentId, {
      isHighlight: true,
      expiresAt: null // Never expire
    }, { new: true });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getUserHighlights = async (req: Request, res: Response) => {
  const { handle } = req.params;

  if (isMockMode()) return res.json([]);

  try {
    const user = await User.findOne({ userid: String(handle).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const highlights = await Moment.find({ user: user._id, isHighlight: true })
      .populate('user', 'userid name profilePic')
      .populate('viewers', 'userid name profilePic')
      .sort({ createdAt: 1 }); // Chronological order for highlights

    res.json(highlights);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
