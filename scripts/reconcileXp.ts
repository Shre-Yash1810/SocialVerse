import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Post from '../src/models/Post';
import Comment from '../src/models/Comment';
import { XP_REWARDS, XP_LEVELS } from '../src/utils/constants';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialverse';

async function reconcileXp(targetUserId?: string, apply: boolean = false) {
  try {
    console.log(`Starting reconciliation. Target: ${targetUserId || 'ALL'}, Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const query = (targetUserId && targetUserId !== 'all') 
      ? (mongoose.Types.ObjectId.isValid(targetUserId) ? { _id: targetUserId } : { userid: targetUserId.toLowerCase() }) 
      : {};
    const users = await User.find(query);
    console.log(`Found ${users.length} users to reconcile.`);

    if (users.length === 0) {
      console.log(`Could not find user with ID/Handle: ${targetUserId}`);
    }

    for (const user of users) {
      console.log(`\nReconciling XP for: ${user.name} (@${user.userid})`);
      console.log(`Current XP: ${user.xp}, Current Level: ${user.level}`);

      let reconciledXp = 0;

      // 1. Calculate XP from Likes on their posts (Only from others)
      const userPosts = await Post.find({ author: user._id });
      let totalLikesFromOthers = 0;

      for (const post of userPosts) {
          // Count likes excluding the author's own like
          const othersLikes = post.likes.filter(id => id.toString() !== user._id.toString());
          totalLikesFromOthers += othersLikes.length;
      }
      
      const likesXp = totalLikesFromOthers * XP_REWARDS.LIKE;
      reconciledXp += likesXp;
      console.log(`- Likes (from others): ${totalLikesFromOthers} (${likesXp} XP)`);

      // 2. Calculate XP from Comments on their posts (Only from others)
      let totalCommentsFromOthers = 0;
      for (const post of userPosts) {
          const othersComments = await Comment.countDocuments({ 
              post: post._id, 
              author: { $ne: user._id } 
          });
          totalCommentsFromOthers += othersComments;
      }
      
      const commentsXp = totalCommentsFromOthers * XP_REWARDS.COMMENT;
      reconciledXp += commentsXp;
      console.log(`- Comments (from others): ${totalCommentsFromOthers} (${commentsXp} XP)`);

      // 3. Add Annual Bonuses
      const currentYear = new Date().getFullYear();
      let bonusXp = 0;
      
      if (user.lastBirthdayRewardYear === currentYear) {
          bonusXp += XP_REWARDS.BIRTHDAY_BONUS;
      }
      if (user.lastAnniversaryRewardYear === currentYear) {
          bonusXp += XP_REWARDS.ANNIVERSARY_BONUS;
      }

      reconciledXp += bonusXp;
      console.log(`- Annual Bonuses: ${bonusXp} XP`);

      console.log(`Reconciled Total XP: ${reconciledXp}`);

      // Calculate Level based on Reconciled XP
      let newLevel = 1;
      while (XP_LEVELS[newLevel + 1] && reconciledXp >= XP_LEVELS[newLevel + 1]) {
        newLevel++;
      }
      console.log(`Calculated Level: ${newLevel}`);

      if (apply) {
        user.xp = reconciledXp;
        user.level = newLevel;
        await user.save();
        console.log(`✅ Updated successfully!`);
      } else {
        console.log(`(Dry-run) - No changes made.`);
      }
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Reconciliation failed:', err);
    await mongoose.connection.close();
  }
}

// Get args from command line
const targetId = process.argv[2];
const shouldApply = process.argv[3] === 'apply';

reconcileXp(targetId, shouldApply);
