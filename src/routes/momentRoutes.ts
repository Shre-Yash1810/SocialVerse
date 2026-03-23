import express from 'express';
import { createMoment, getMoments, markMomentAsViewed, deleteMoment, highlightMoment, getUserHighlights } from '../controllers/momentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createMoment);
router.get('/', protect, getMoments);
router.get('/user/:handle/highlights', protect, getUserHighlights);
router.post('/view/:momentId', protect, markMomentAsViewed);
router.delete('/:momentId', protect, deleteMoment);
router.post('/:momentId/highlight', protect, highlightMoment);

export default router;
