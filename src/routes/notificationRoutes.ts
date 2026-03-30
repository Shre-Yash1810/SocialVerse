import express from 'express';
import { getNotifications, markAsRead, getUnreadCount, markAllAsRead } from '../controllers/notificationController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

export default router;
