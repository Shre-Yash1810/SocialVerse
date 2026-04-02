import { Request, Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import Comment from '../models/Comment';
import Report from '../models/Report';
import CloudinaryService from '../services/CloudinaryService';
import XPService from '../services/XPService';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from '../services/socketService';
import { extractUserIdsFromMentions } from '../utils/mentionUtils';
import mongoose from 'mongoose';

export const createPost = async (req: Request, res: Response) => {
  let { type, content, caption, hashtags, taggedUsers, expiresAt } = req.body;

  try {
    // If content is base64 (starts with data:), upload to Cloudinary
    if (content && content.startsWith('data:')) {
      const folder = type === 'Video' ? 'reels' : (type === 'Blog' ? 'blogs' : 'posts');
      content = await CloudinaryService.uploadFile(content, folder);
    }

    const post = await Post.create({
      author: (req as any).user._id,
      type,
      content,
      caption,
      hashtags,
      taggedUsers,
      expiresAt: type === 'Moment' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : expiresAt,
    });

    // Handle Mentions
    if (caption) {
      const mentionedUserIds = await extractUserIdsFromMentions(caption);
      for (const mentionId of mentionedUserIds) {
        // Don't notify yourself
        if (mentionId.toString() === (req as any).user._id.toString()) continue;

        const notif = await Notification.create({
          recipient: mentionId,
          sender: (req as any).user._id,
          type: 'MENTION',
          post: post._id,
          extraInfo: caption.substring(0, 50)
        });
        sendRealTimeNotification(mentionId.toString(), notif);
      }
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const likePost = async (req: Request, res: Response) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId as string);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = (req as any).user._id;
    const isLiked = post.likes.some(id => id.toString() === userId.toString());

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();

      // Subtract XP from author on unlike (Only if not self-engagement)
      if (post.author.toString() !== userId.toString()) {
        await XPService.handleInteraction(userId, post.author.toString(), 'UNLIKE');
      }

      return res.json({ message: 'Post unliked', likesCount: post.likes.length, likes: post.likes });
    } else {
      post.likes.push(userId);
      await post.save();
      
      if (post.author.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'LIKE',
          post: post._id
        });
        sendRealTimeNotification(post.author.toString(), notification);
        await XPService.handleInteraction(userId, post.author.toString(), 'LIKE');
      }

      return res.json({ message: 'Post liked', likesCount: post.likes.length, likes: post.likes });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = (req as any).user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Verify ownership
    if (post.author.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Unauthorized. You can only delete your own posts.' });
    }

    // 1. Subtract XP from the author for all engagement earned on this post
    await XPService.handlePostDeletion(postId as string, userId.toString());

    // 2. Delete associated comments
    await Comment.deleteMany({ post: postId });

    // 3. Delete from Cloudinary if it's an uploaded file
    if (post.content && post.content.includes('cloudinary.com')) {
      await CloudinaryService.deleteFile(post.content);
    }

    // 4. Delete the post document
    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Post deleted successfully, and associated XP has been removed.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const savePost = async (req: Request, res: Response) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId as string);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = (req as any).user._id;
    const isSaved = post.savedBy.some(id => id.toString() === userId.toString());

    if (isSaved) {
      post.savedBy = post.savedBy.filter((id) => id.toString() !== userId.toString());
      await post.save();
      return res.json({ message: 'Post unsaved', savedBy: post.savedBy });
    } else {
      post.savedBy.push(userId);
      await post.save();
      return res.json({ message: 'Post saved', savedBy: post.savedBy });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user._id);
    const blockedList = user?.blockedUsers || [];

    const posts = await Post.find({
      author: { $nin: blockedList },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .populate('author', 'userid name profilePic isVerified')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getComments = async (req: Request, res: Response) => {
  const { postId } = req.params;

  try {
    const comments = await Comment.find({ post: postId as string })
      .populate('author', 'userid name profilePic isVerified')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getFollowingFeed = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user._id);
    const followingList = user?.following || [];

    const posts = await Post.find({
      author: { $in: followingList },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .populate('author', 'userid name profilePic isVerified')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  const { handle } = req.params;

  try {
    const lowerCaseHandle = (handle as string).toLowerCase();
    const user = await User.findOne({ userid: lowerCaseHandle });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .populate('author', 'userid name profilePic isVerified')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const reportPost = async (req: Request, res: Response) => {
  const { targetId, reason, targetType, screenshot } = req.body;
  const userId = (req as any).user._id;

  try {
    let finalScreenshot = screenshot;
    if (screenshot && screenshot.startsWith('data:image')) {
      finalScreenshot = await CloudinaryService.uploadFile(screenshot, 'reports');
    }

    const report = await Report.create({
      reporter: userId,
      targetType: targetType || 'Post',
      target: targetId,
      reason,
      screenshot: finalScreenshot
    });

    res.status(201).json({ message: 'Content reported successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId)
      .populate('author', 'userid name profilePic isVerified');
    
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const userId = (req as any).user._id;
    const postWithMeta = {
      ...post.toObject(),
      isLiked: post.likes?.some((id: any) => id.toString() === userId.toString()),
      isSaved: post.savedBy?.some((id: any) => id.toString() === userId.toString())
    };
    
    res.json(postWithMeta);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
