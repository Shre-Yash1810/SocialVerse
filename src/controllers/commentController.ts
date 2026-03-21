import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { sendRealTimeNotification } from '../services/socketService';

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
    
    // Create notification for the post owner
    if (post && post.author.toString() !== (req as any).user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: (req as any).user._id,
        type: 'COMMENT',
        post: postId,
        extraInfo: text
      });
      sendRealTimeNotification(post.author.toString(), notif);
    }

    // If it's a reply to another comment, notify the original comment author
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.author.toString() !== (req as any).user._id.toString()) {
        const notif = await Notification.create({
          recipient: parentComment.author,
          sender: (req as any).user._id,
          // Sending COMMENT type for replies as well, frontend can distinguish by checking if there's parentComment context if needed, or we just rely on the message. The model only supports 'COMMENT', 'LIKE', 'WAVE', 'FOLLOW', 'MENTION', 'MESSAGE'.
          type: 'COMMENT', 
          post: postId,
          extraInfo: text
        });
        sendRealTimeNotification(parentComment.author.toString(), notif);
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
