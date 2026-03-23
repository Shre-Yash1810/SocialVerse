import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Post from '../models/Post';
import { sendRealTimeMessage, notifyMessageDeleted } from '../services/socketService';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const getChats = async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json([
      { 
        _id: 'chat1', 
        participants: [
          { userid: 'jupiter_explorer', name: 'Jupiter', profilePic: 'https://ui-avatars.com/api/?name=Jupiter' },
          { userid: 'me', name: 'You' }
        ], 
        isGroup: false, 
        lastMessage: { text: 'The rings look amazing! 🪐', createdAt: new Date() },
        updatedAt: new Date()
      },
      { 
        _id: 'chat2', 
        participants: [
          { userid: 'mars_rover', name: 'Mars' },
          { userid: 'venus_vibe', name: 'Venus' },
          { userid: 'me', name: 'You' }
        ], 
        isGroup: true, 
        name: 'SocialVerse Explorers',
        lastMessage: { text: 'Welcome to the group!', createdAt: new Date() },
        updatedAt: new Date()
      }
    ]);
  }
  try {
    const userId = (req as any).user._id;
    // Filter chats where the current user is a participant
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'userid name profilePic lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'userid name' }
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;

  if (isMockMode()) {
    return res.json({ 
      _id: chatId, 
      participants: [
        { _id: 'u1', userid: 'jupiter_explorer', name: 'Jupiter', profilePic: 'https://ui-avatars.com/api/?name=Jupiter' },
        { _id: 'me', userid: 'me', name: 'You' }
      ], 
      isGroup: chatId === 'chat2' 
    });
  }

  try {
    const chat = await Chat.findById(chatId).populate('participants', 'userid name profilePic lastSeen');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { chatId } = req.params;

  if (isMockMode()) {
    return res.json([
      { 
        _id: 'm1', 
        sender: { _id: 'u1', userid: 'jupiter_explorer', name: 'Jupiter', profilePic: 'https://ui-avatars.com/api/?name=Jupiter' }, 
        text: 'Welcome to the galaxy! 🌌', 
        createdAt: new Date(Date.now() - 3600000).toISOString() 
      },
      { 
        _id: 'm2', 
        sender: { _id: (req as any).user?._id || 'me', userid: 'me', name: 'You' }, 
        text: 'The view is breath-taking.', 
        createdAt: new Date(Date.now() - 1800000).toISOString() 
      },
      { 
        _id: 'm3', 
        sender: { _id: 'u1', userid: 'jupiter_explorer', name: 'Jupiter' }, 
        text: 'Look at those Saturn rings in the chat list. Amazing work! 🪐', 
        createdAt: new Date().toISOString() 
      }
    ]);
  }

  try {
    const messages = await Message.find({ chat: chatId, isDeleted: false })
      .populate('sender', 'userid name profilePic')
      .populate({
        path: 'sharedPost',
        populate: { path: 'author', select: 'userid name profilePic' }
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createChat = async (req: Request, res: Response) => {
  const { participants, isGroup, name } = req.body;

  if (isGroup && participants.length > 15) {
    return res.status(400).json({ message: 'Group size limit is 15' });
  }

  if (isMockMode()) {
    return res.status(201).json({ _id: 'mock_chat_' + Date.now(), isGroup, name });
  }

  try {
    // If it's a 1-on-1 chat, check if it already exists
    if (!isGroup && participants.length === 1) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [participants[0], (req as any).user._id], $size: 2 }
      });
      if (existingChat) {
        return res.json(existingChat);
      }
    }

    const chat = await Chat.create({
      participants: [...participants, (req as any).user._id],
      admins: [(req as any).user._id],
      isGroup,
      name,
      groupPic: isGroup ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'G')}&background=random` : ''
    });
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { name, groupPic } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    if (name) chat.name = name;
    
    if (groupPic && groupPic.startsWith('data:image')) {
      const CloudinaryService = require('../services/CloudinaryService').default;
      const groupPicUrl = await CloudinaryService.uploadFile(groupPic, 'group_pics');
      chat.groupPic = groupPicUrl;
    } else if (groupPic) {
      chat.groupPic = groupPic;
    }

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  const { chatId, userId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    // Check if the requester is an admin
    const isAdmin = chat.admins.some(admin => admin.toString() === (req as any).user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove participants' });

    chat.participants = chat.participants.filter(p => p.toString() !== userId);
    chat.admins = chat.admins.filter(a => a.toString() !== userId);

    await chat.save();
    res.json({ message: 'Participant removed', chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const unsendMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;

  if (isMockMode()) {
    return res.json({ message: 'Message unsent (Mock Mode)' });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== (req as any).user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    message.isDeleted = true;
    await message.save();

    // Notify other participants via socket
    const chat = await Chat.findById(message.chat);
    if (chat) {
      chat.participants.forEach((participantId: any) => {
        if (participantId.toString() !== (req as any).user._id.toString()) {
          notifyMessageDeleted(participantId.toString(), chat._id.toString(), message._id.toString());
        }
      });
    }

    res.json({ message: 'Message unsent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const addParticipants = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { participants } = req.body; // Array of user IDs

  if (isMockMode()) {
    return res.json({ message: 'Participants added (Mock Mode)' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    const newParticipantsCount = chat.participants.length + participants.length;
    if (newParticipantsCount > 15) {
      return res.status(400).json({ message: 'Group size limit is 15' });
    }

    // Only add if not already in participants
    const newParticipants = participants.filter((p: string) => !chat.participants.some(cp => cp.toString() === p));
    chat.participants.push(...newParticipants);
    await chat.save();

    res.json({ message: 'Participants added', chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const leaveChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userId = (req as any).user._id;

  if (isMockMode()) {
    return res.json({ message: 'Left chat (Mock Mode)' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.participants = chat.participants.filter((p) => p.toString() !== userId.toString());
    chat.admins = chat.admins.filter((a) => a.toString() !== userId.toString());
    
    // If it was the last admin, assign a new one
    if (chat.isGroup && chat.admins.length === 0 && chat.participants.length > 0) {
      chat.admins.push(chat.participants[0]);
    }

    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
    } else {
      await chat.save();
    }

    res.json({ message: 'Successfully left the chat' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { text, media, type } = req.body;

  if (isMockMode()) {
    return res.status(201).json({ _id: 'mock_msg_' + Date.now(), text, type });
  }

  try {
    const message = await Message.create({
      chat: chatId as any,
      sender: (req as any).user._id,
      text,
      media,
      type: (type || 'text') as any
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'userid name profilePic');

    const chat = await Chat.findByIdAndUpdate(
      chatId, 
      { lastMessage: message._id },
      { new: true }
    ) as any;

    if (chat) {
       chat.participants.forEach((participantId: any) => {
         if (participantId.toString() !== (req as any).user._id.toString()) {
           sendRealTimeMessage(participantId.toString(), populatedMessage);
         }
       });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const sharePost = async (req: Request, res: Response) => {
  const { postId, targets } = req.body; // targets: { id: string, type: 'user'|'chat' }[]
  const senderId = (req as any).user._id;

  if (!postId || !targets || !Array.isArray(targets)) {
    return res.status(400).json({ message: 'Invalid share data' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    let shareText = 'Shared a post';
    if (post.type === 'Video') shareText = 'Shared a byte';
    if (post.type === 'Blog') shareText = 'Shared a blog';

    const results = [];

    for (const target of targets) {
      let chatId = '';

      if (target.type === 'chat') {
        chatId = target.id;
      } else {
        // Find or create 1-on-1 chat
        let chat = await Chat.findOne({
          isGroup: false,
          participants: { $all: [target.id, senderId], $size: 2 }
        });

        if (!chat) {
          chat = await Chat.create({
            participants: [target.id, senderId],
            admins: [senderId],
            isGroup: false,
            name: '',
          });
        }
        chatId = chat._id.toString();
      }

      const message = await Message.create({
        chat: chatId as any,
        sender: senderId,
        type: 'post_share',
        sharedPost: postId as any,
        text: shareText
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'userid name profilePic')
        .populate({
           path: 'sharedPost',
           populate: { path: 'author', select: 'userid name profilePic' }
        });

      // Update chat last message
      const updatedChat = await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id }, { new: true });

      // Notify via socket
      if (updatedChat) {
        updatedChat.participants.forEach((p: any) => {
          if (p.toString() !== senderId.toString()) {
            sendRealTimeMessage(p.toString(), populatedMessage);
          }
        });
      }

      results.push(populatedMessage);
    }

    res.status(201).json(results);
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
