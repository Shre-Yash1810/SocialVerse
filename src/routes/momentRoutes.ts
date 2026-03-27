import express from 'express';
import { createMoment, getMoments, markMomentAsViewed, deleteMoment, memoryMoment, getUserMemories } from '../controllers/momentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createMoment);
router.get('/', protect, getMoments);
router.get('/user/:handle/memories', protect, getUserMemories);
router.post('/:momentId/view', protect, markMomentAsViewed);
router.delete('/:momentId', protect, deleteMoment);
router.post('/:momentId/memory', protect, memoryMoment);

export default router;
