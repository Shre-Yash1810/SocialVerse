import { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Report from '../models/Report';
import Moment from '../models/Moment';
import Chat from '../models/Chat';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'founder' && (req as any).user.role !== 'founder') {
      return res.status(403).json({ message: 'Only a founder can delete another founder' });
    }

    await User.findByIdAndDelete(id);
    // Optionally delete user's posts and comments
    await Post.deleteMany({ author: id });
    await Comment.deleteMany({ author: id });

    res.json({ message: 'User and their content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();
    const momentCount = await Moment.countDocuments();
    const chatCount = await Chat.countDocuments();
    const reportCount = await Report.countDocuments({ status: 'Pending' });
    
    // Time periods
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Growth Metrics
    const newUsersLast24h = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const newUsersPrev24h = await User.countDocuments({ createdAt: { $gte: twoDaysAgo, $lt: oneDayAgo } });
    
    const newPostsLast24h = await Post.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const newPostsPrev24h = await Post.countDocuments({ createdAt: { $gte: twoDaysAgo, $lt: oneDayAgo } });

    const userGrowth = newUsersPrev24h === 0 ? 100 : Math.round(((newUsersLast24h - newUsersPrev24h) / newUsersPrev24h) * 100);
    const postGrowth = newPostsPrev24h === 0 ? 100 : Math.round(((newPostsLast24h - newPostsPrev24h) / newPostsPrev24h) * 100);

    // Active Users (posted or commented in last 7 days)
    const activeUserIds = await Post.distinct('author', { createdAt: { $gte: sevenDaysAgo } });
    const activeCommenterIds = await Comment.distinct('author', { createdAt: { $gte: sevenDaysAgo } });
    const totalActiveUsers = new Set([...activeUserIds.map(id => id.toString()), ...activeCommenterIds.map(id => id.toString())]).size;

    // Top Users by post count
    const topUsers = await Post.aggregate([
      { $group: { _id: '$author', posts: { $sum: 1 } } },
      { $sort: { posts: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
      { $unwind: '$userDetails' },
      { $project: { name: '$userDetails.name', userid: '$userDetails.userid', posts: 1 } }
    ]);

    // Trending Hashtags
    const hashtags = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Growth Trend for last 7 days
    const trendResults = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          users: { $sum: 1 } 
      } },
      { $sort: { _id: 1 } }
    ]);

    const postTrendResults = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          posts: { $sum: 1 } 
      } },
      { $sort: { _id: 1 } }
    ]);

    // Merge into unique trendData array
    const trendMap: any = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      trendMap[d] = { date: d, users: 0, posts: 0 };
    }
    trendResults.forEach(r => { if (trendMap[r._id]) trendMap[r._id].users = r.users; });
    postTrendResults.forEach(r => { if (trendMap[r._id]) trendMap[r._id].posts = r.posts; });

    const trendData = Object.values(trendMap);

    res.json({
      userCount,
      postCount,
      commentCount,
      momentCount,
      chatCount,
      reportCount,
      newUsers: newUsersLast24h,
      userGrowth,
      postGrowth,
      activeUsers7d: totalActiveUsers,
      topUsers,
      hashtags,
      trendData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin', 'founder'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (id === (req as any).user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    user.role = role as 'user' | 'admin' | 'founder';
    await user.save();

    res.json({ message: `User role updated to ${role} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const toggleUserVerification = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({ 
      message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully`, 
      isVerified: user.isVerified 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const toggleUserBan = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'founder' && (req as any).user.role !== 'founder') {
      return res.status(403).json({ message: 'Only a founder can ban another founder' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ 
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`, 
      isBanned: user.isBanned 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name userid profilePic')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteAdminPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ post: id });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name userid profilePic')
      .sort({ createdAt: -1 });
    
    // Manual population for target based on targetType
    const populatedReports = await Promise.all(reports.map(async (report: any) => {
      const reportObj = report.toObject();
      const tType = report.targetType?.toLowerCase();
      
      if (tType === 'user') {
        reportObj.target = await User.findById(report.target).select('name userid profilePic');
      } else if (['post', 'blog', 'moment'].includes(tType)) {
        reportObj.target = await Post.findById(report.target).populate('author', 'userid name');
      } else if (report.targetType === 'User') { // Legacy support
        reportObj.target = await User.findById(report.target).select('name userid profilePic');
      } else if (report.targetType === 'Post') { // Legacy support
        reportObj.target = await Post.findById(report.target).populate('author', 'userid name');
      }
      return reportObj;
    }));

    res.json(populatedReports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['Resolved', 'Dismissed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = status as 'Resolved' | 'Dismissed';
    await report.save();

    // If Resolved (Action Taken) and target is a post, we might want to hide it or delete it.
    // For now, if it's Resolved, we mark it as handled. 
    // If the Admin specifically wants to delete, they can do it from the content tabs,
    // but here we mark the case as "Concluded with Action".

    res.json({ message: `Report ${status.toLowerCase()} successfully`, report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
