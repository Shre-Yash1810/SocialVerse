import User, { IUser } from '../models/User';
import { XP_LEVELS, XP_REWARDS } from '../utils/constants';
import mongoose from 'mongoose';

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
}

export default new XPService();
