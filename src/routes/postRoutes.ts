import express from 'express';
import { createPost, likePost, savePost, getFeed, getFollowingFeed, getComments, getUserPosts, reportPost } from '../controllers/postController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createPost);
router.post('/report', protect, reportPost);
router.get('/feed', protect, getFeed);
router.get('/following-feed', protect, getFollowingFeed);
router.get('/user/:handle', protect, getUserPosts);
router.get('/:postId/comments', protect, getComments);
router.post('/:postId/like', protect, likePost);
router.post('/:postId/save', protect, savePost);

export default router;
