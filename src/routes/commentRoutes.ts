import express from 'express';
import { createComment, deleteComment, reportComment } from '../controllers/commentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/report', protect, reportComment);

export default router;
