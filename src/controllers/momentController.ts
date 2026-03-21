import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Moment from '../models/Moment';
import User from '../models/User';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const createMoment = async (req: Request, res: Response) => {
  const { media, type } = req.body;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.status(201).json({ message: 'Moment created (Mock Mode)', media, type });
  }

  try {
    const moment = await Moment.create({
      user: userId,
      media,
      type: type || 'image'
    });
    res.status(201).json(moment);
  } catch (error) {
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
    const moments = await Moment.find({})
      .populate('user', 'userid name profilePic')
      .sort({ createdAt: -1 })
      .limit(20);

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
