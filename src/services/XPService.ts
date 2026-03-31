import User, { IUser } from '../models/User';
import { XP_LEVELS, XP_REWARDS } from '../utils/constants';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from './socketService';

const isMockMode = () => mongoose.connection.readyState !== 1;

class XPService {
  async addXP(userId: string, points: number) {
    if (isMockMode()) return;
    const user = await User.findById(userId);
    if (!user) return;

    user.xp += points;

    // Check for level up
    let newLevel = user.level;
    while (XP_LEVELS[newLevel + 1] && user.xp >= XP_LEVELS[newLevel + 1]) {
      newLevel++;
    }

    if (newLevel > user.level) {
      user.level = newLevel;
      // TODO: Emit socket event for level up
    }

    await user.save();
    return user;
  }

  async handleInteraction(interactorId: string, authorId: string, action: 'LIKE' | 'COMMENT' | 'UNLIKE' | 'DELETE_COMMENT') {
    if (isMockMode()) return;
    const interactor = await User.findById(interactorId);
    if (!interactor) return;

    // Engagement only counts if the account is at least 24 hours old
    const accountAge = (Date.now() - interactor.createdAt.getTime()) / (1000 * 60 * 60);
    if (accountAge < 24) return;

    let points = 0;
    switch (action) {
      case 'LIKE':
        points = XP_REWARDS.LIKE;
        break;
      case 'COMMENT':
        points = XP_REWARDS.COMMENT;
        break;
      case 'UNLIKE':
        points = -XP_REWARDS.LIKE;
        break;
      case 'DELETE_COMMENT':
        points = -XP_REWARDS.COMMENT;
        break;
    }

    if (points !== 0) {
      await this.addXP(authorId, points);
    }
  }

  async checkAndAwardAnnualBonuses(userId: string) {
    if (isMockMode()) return;
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    let updated = false;

    // Helper to check if it's the "day or after" for this year's event
    const isEventPassed = (eventDate: Date) => {
      const eventThisYear = new Date(currentYear, eventDate.getMonth(), eventDate.getDate());
      return today >= eventThisYear;
    };

    // Birthday Bonus
    if (isEventPassed(user.dob) && user.lastBirthdayRewardYear < currentYear) {
      await this.addXP(userId, XP_REWARDS.BIRTHDAY_BONUS);
      user.lastBirthdayRewardYear = currentYear;
      updated = true;
      
      await this.createSystemNotification(userId, 'BIRTHDAY', `Happy Birthday! You've received ${XP_REWARDS.BIRTHDAY_BONUS} XP! 🎂`);
    }

    // Anniversary Bonus (Only if account is at least 1 year old)
    if (isEventPassed(user.createdAt) && user.lastAnniversaryRewardYear < currentYear) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (user.createdAt <= oneYearAgo) {
        await this.addXP(userId, XP_REWARDS.ANNIVERSARY_BONUS);
        user.lastAnniversaryRewardYear = currentYear;
        updated = true;
        await this.createSystemNotification(userId, 'ANNIVERSARY', `Happy SocialVerse Anniversary! You've received ${XP_REWARDS.ANNIVERSARY_BONUS} XP! 🚀`);
      }
    }

    if (updated) {
      await user.save();
    }
  }

  private async createSystemNotification(userId: string, type: 'BIRTHDAY' | 'ANNIVERSARY', message: string) {
    try {
      const systemUser = await User.findOne({ userid: 'socialverse_guide' });
      if (!systemUser) return;

      const notification = await Notification.create({
        recipient: new mongoose.Types.ObjectId(userId),
        sender: systemUser._id,
        type,
        extraInfo: message
      });
      sendRealTimeNotification(userId, notification);
    } catch (err) {
      console.error('Error creating system notification:', err);
    }
  }
}

export default new XPService();
