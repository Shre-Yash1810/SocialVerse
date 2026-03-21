import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from '../services/socketService';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const getNearbyUsers = async (req: Request, res: Response) => {
  const { longitude, latitude } = req.query;

  if (isMockMode()) {
    return res.json([
      { userid: 'nearby1', name: 'Nearby Alex', xp: 120, level: 2 },
      { userid: 'nearby2', name: 'Nearby Sam', xp: 450, level: 3 }
    ]);
  }

  if (!longitude || !latitude) {
    return res.status(400).json({ message: 'Coordinates are required' });
  }

  try {
    const user = await User.findById((req as any).user._id);
    const blockedList = user?.blockedUsers || [];
    const followingList = user?.following || [];

    const searchableNearby = {
      isDiscoveryEnabled: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: 500,
        },
      },
      _id: { $ne: (req as any).user._id, $nin: [...blockedList, ...followingList] },
    };

    const users = await User.find(searchableNearby).select('userid name profilePic xp level location');

    // DEBUG LOGS
    const allDiscoverable = await User.find({ isDiscoveryEnabled: true }).select('userid location');
    console.log(`--- DEBUG: Discovery Search by ${user?.userid} ---`);
    console.log(`Search Coords: [${longitude}, ${latitude}]`);
    console.log(`Found ${users.length} users within 100m`);
    console.log(`Other Discoverable Users:`, allDiscoverable.map(u => ({
       userid: u.userid,
       coords: u.location?.coordinates,
       isSame: u.userid === user?.userid
    })));
    console.log(`----------------------------------------------`);

    res.json(users);
  } catch (error) {
    console.error("Discovery Error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const toggleDiscovery = async (req: Request, res: Response) => {
  const { enabled } = req.body;

  if (isMockMode()) {
    return res.json({ message: 'Discovery toggled (Mock Mode)', enabled });
  }

  try {
    const user = await User.findByIdAndUpdate(
      (req as any).user._id,
      { isDiscoveryEnabled: enabled },
      { new: true }
    );
    res.json({ message: `Discovery ${enabled ? 'enabled' : 'disabled'}`, enabled: user?.isDiscoveryEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  const { longitude, latitude } = req.body;

  if (isMockMode()) {
    return res.json({
      message: 'Location updated (Mock Mode)',
      location: { type: 'Point', coordinates: [longitude, latitude] }
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      (req as any).user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        lastSeen: new Date(),
      },
      { new: true }
    );

    console.log(`[Discovery] User ${(req as any).user._id} updated location to:`, [longitude, latitude]);

    res.json({ message: 'Location updated', location: user?.location });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const waveAtUser = async (req: Request, res: Response) => {
  const { targetId } = req.params;
  const userId = (req as any).user._id;

  if (isMockMode()) return res.json({ message: 'Waved at user (Mock Mode)', targetId });

  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Create a 'WAVE' notification
    const notification = await Notification.create({
      recipient: new mongoose.Types.ObjectId(targetId as string),
      sender: userId,
      type: 'WAVE',
    });

    sendRealTimeNotification(targetId as string, notification);

    res.json({ message: 'Waved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
