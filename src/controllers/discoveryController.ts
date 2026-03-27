import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import UserDevice from '../models/UserDevice';
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
    const currentUser = await User.findById((req as any).user._id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    
    const blockedList = currentUser.blockedUsers || [];
    const followingList = currentUser.following || [];

    // Find nearby devices
    const nearbyDevices = await UserDevice.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: 500, // 500 meters
        },
      },
    }).populate({
      path: 'user',
      select: 'userid name profilePic xp level isDiscoveryEnabled blockedUsers following'
    });

    // Filter and deduplicate users
    const uniqueUsersMap = new Map();
    
    nearbyDevices.forEach((device: any) => {
      const u = device.user;
      if (!u || !u.isDiscoveryEnabled) return;
      
      const uId = u._id.toString();
      const currentUserId = (req as any).user._id.toString();
      
      // Basic filtering: Not self, not blocked, not already following (as per existing logic)
      if (uId === currentUserId) return;
      if (blockedList.some(id => id.toString() === uId)) return;
      if (followingList.some(id => id.toString() === uId)) return;
      
      // If user A has multiple devices, only show the closest one (Map will keep the first/closest)
      if (!uniqueUsersMap.has(uId)) {
        uniqueUsersMap.set(uId, {
          _id: u._id,
          userid: u.userid,
          name: u.name,
          profilePic: u.profilePic,
          xp: u.xp,
          level: u.level,
          location: device.location // Use the specific device location
        });
      }
    });

    const users = Array.from(uniqueUsersMap.values());

    // DEBUG LOGS
    console.log(`--- DEBUG: Discovery Search by ${currentUser.userid} ---`);
    console.log(`Search Coords: [${longitude}, ${latitude}]`);
    console.log(`Found ${users.length} unique users nearby`);
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
  const { longitude, latitude, deviceId } = req.body;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.json({
      message: 'Location updated (Mock Mode)',
      location: { type: 'Point', coordinates: [longitude, latitude] }
    });
  }

  try {
    // 1. Update the main User location (Primary/Fallback)
    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        lastSeen: new Date(),
      },
      { new: true }
    );

    // 2. If deviceId is provided, upsert into UserDevice
    if (deviceId) {
      await UserDevice.findOneAndUpdate(
        { user: userId, deviceId },
        { 
          location: { type: 'Point', coordinates: [longitude, latitude] },
          lastSeen: new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`[Discovery] User ${userId} updated location for device ${deviceId} to:`, [longitude, latitude]);
    } else {
      console.log(`[Discovery] User ${userId} updated primary location to:`, [longitude, latitude]);
    }

    res.json({ message: 'Location updated', location: user?.location });
  } catch (error) {
    console.error("Update Location Error:", error);
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
