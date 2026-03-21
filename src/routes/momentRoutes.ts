import express from 'express';
import { createMoment, getMoments, markMomentAsViewed } from '../controllers/momentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createMoment);
router.get('/', protect, getMoments);
router.post('/view/:momentId', protect, markMomentAsViewed);

export default router;
