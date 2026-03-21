import express from 'express';
import { blockUser, unblockUser, reportUser, followUser, unfollowUser, searchUsers, getUserProfile, updateProfile, getMe, getBlockedUsers } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/me', protect, getMe);
router.get('/blocked', protect, getBlockedUsers);
router.post('/block/:targetId', protect, blockUser);
router.delete('/unblock/:targetId', protect, unblockUser);
router.post('/report', protect, reportUser);
router.post('/follow/:targetId', protect, followUser);
router.delete('/unfollow/:targetId', protect, unfollowUser);
router.get('/search', protect, searchUsers);
router.get('/profile/:handle', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

export default router;
