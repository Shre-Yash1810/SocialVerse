import express from 'express';
import { getChats, getChat, getMessages, createChat, unsendMessage, addParticipants, leaveChat, sendMessage, removeParticipant, updateChat, sharePost } from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getChats);
router.post('/share', protect, sharePost);
router.get('/:chatId', protect, getChat);
router.post('/', protect, createChat);
router.get('/:chatId/messages', protect, getMessages);
router.delete('/messages/:messageId', protect, unsendMessage);
router.post('/:chatId/messages', protect, sendMessage);
router.post('/:chatId/participants', protect, addParticipants);
router.delete('/:chatId/participants/:userId', protect, removeParticipant);
router.put('/:chatId', protect, updateChat);
router.get('/test_db', async (req, res) => {
  try {
    const Chat = require('../models/Chat').default;
    const count = await Chat.countDocuments();
    res.json({ message: 'DB works', count });
  } catch(e) {
    res.status(500).json({ error: String(e), stack: (e as any).stack });
  }
});
router.get('/:chatId/leave', protect, leaveChat);

export default router;
