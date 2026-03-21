import { Request, Response } from 'express';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const getNotifications = async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json([
      { _id: 'notif1', type: 'LIKE', message: 'Someone liked your post', isRead: false }
    ]);
  }

  try {
    const notifications = await Notification.find({ recipient: (req as any).user._id })
      .populate('sender', 'userid name profilePic')
      .populate('post', 'type content')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isMockMode()) {
    return res.json({ _id: id, isRead: true, message: 'Notification marked as read (Mock Mode)' });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
