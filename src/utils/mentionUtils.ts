import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Extracts usernames (e.g. @username) from string and returns unique User ObjectIds
 */
export const extractUserIdsFromMentions = async (text: string): Promise<mongoose.Types.ObjectId[]> => {
  if (!text) return [];

  // Regex for @username (alphanumeric and underscores)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = text.match(mentionRegex);

  if (!matches) return [];

  const uniqueUserids = Array.from(new Set(matches.map(m => m.slice(1).toLowerCase())));
  const userIds: mongoose.Types.ObjectId[] = [];

  for (const userid of uniqueUserids) {
    const user = await User.findOne({ userid });
    if (user) {
      userIds.push(user._id as mongoose.Types.ObjectId);
    }
  }

  return userIds;
};
