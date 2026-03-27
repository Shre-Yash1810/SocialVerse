import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from '../services/socketService';
import { extractUserIdsFromMentions } from '../utils/mentionUtils';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const createComment = async (req: Request, res: Response) => {
  const { postId, text, parentCommentId } = req.body;

  if (isMockMode()) {
    return res.status(201).json({ _id: 'mock_comment_' + Date.now(), text, author: (req as any).user._id });
  }

  try {
    const comment = await Comment.create({
      post: postId,
      author: (req as any).user._id,
      text,
      parentComment: parentCommentId
    });

    const post = await Post.findByIdAndUpdate(postId as string, { $inc: { commentsCount: 1 } });
    
    // Track who we've already notified to avoid duplicates
    const notifiedUserIds = new Set<string>();
    notifiedUserIds.add((req as any).user._id.toString());

    // 1. Create notification for the post owner
    if (post && !notifiedUserIds.has(post.author.toString())) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: (req as any).user._id,
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
          sender: (req as any).user._id,
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
          sender: (req as any).user._id,
          type: 'MENTION',
          post: postId,
          extraInfo: text.substring(0, 50)
        });
        sendRealTimeNotification(mentionId.toString(), notif);
        notifiedUserIds.add(mentionId.toString());
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isMockMode()) {
    return res.json({ message: 'Comment deleted (Mock Mode)' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Invalid Comment ID' });
    }
    const comment = await Comment.findById(id as string);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== (req as any).user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Comment.findByIdAndDelete(id);
    await Post.findByIdAndUpdate(comment.post as any, { $inc: { commentsCount: -1 } });

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
