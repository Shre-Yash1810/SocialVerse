import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from '../services/socketService';
import { extractUserIdsFromMentions } from '../utils/mentionUtils';
import XPService from '../services/XPService';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const createComment = async (req: Request, res: Response) => {
  const { postId, text, parentCommentId } = req.body;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.status(201).json({ _id: 'mock_comment_' + Date.now(), text, author: userId });
  }

  try {
    const comment = await Comment.create({
      post: postId,
      author: userId,
      text,
      parentComment: parentCommentId
    });

    const post = await Post.findByIdAndUpdate(postId as string, { $inc: { commentsCount: 1 } });
    
    if (post) {
      // Award XP to the post author (Only if NOT self-commenting)
      await XPService.handleInteraction(userId, post.author.toString(), 'COMMENT');

      // Track who we've already notified to avoid duplicates
      const notifiedUserIds = new Set<string>();
      notifiedUserIds.add(userId.toString());

      // 1. Create notification for the post owner
      if (!notifiedUserIds.has(post.author.toString())) {
        const notif = await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'COMMENT',
          post: postId,
          extraInfo: text.substring(0, 50)
        });
        sendRealTimeNotification(post.author.toString(), notif);
        notifiedUserIds.add(post.author.toString());
      }
      
      // 2. If it's a reply to another comment, notify the original comment author
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment && !notifiedUserIds.has(parentComment.author.toString())) {
          const notif = await Notification.create({
            recipient: parentComment.author,
            sender: userId,
            type: 'COMMENT', 
            post: postId,
            extraInfo: text.substring(0, 50)
          });
          sendRealTimeNotification(parentComment.author.toString(), notif);
          notifiedUserIds.add(parentComment.author.toString());
        }
      }

      // 3. Handle Mentions
      const mentionedUserIds = await extractUserIdsFromMentions(text);
      for (const mentionId of mentionedUserIds) {
        if (!notifiedUserIds.has(mentionId.toString())) {
          const notif = await Notification.create({
            recipient: mentionId,
            sender: userId,
            type: 'MENTION',
            post: postId,
            extraInfo: text.substring(0, 50)
          });
          sendRealTimeNotification(mentionId.toString(), notif);
          notifiedUserIds.add(mentionId.toString());
        }
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.json({ message: 'Comment deleted (Mock Mode)' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Invalid Comment ID' });
    }
    const comment = await Comment.findById(id as string);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Subtract XP from post author
    const post = await Post.findById(comment.post as any);
    if (post) {
      await XPService.handleInteraction(userId, post.author.toString(), 'DELETE_COMMENT');
      await Post.findByIdAndUpdate(comment.post as any, { $inc: { commentsCount: -1 } });
    }

    await Comment.findByIdAndDelete(id);

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const reportComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (isMockMode()) {
    return res.json({ message: 'Comment reported (Mock Mode)', reason });
  }

  try {
    const comment = await Comment.findByIdAndUpdate(
      id as string,
      { isReported: true, reportReason: reason },
      { new: true }
    );
    res.json({ message: 'Comment reported', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
