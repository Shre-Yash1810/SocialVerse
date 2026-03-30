import express from 'express';
import { protect, isAdmin } from '../middlewares/authMiddleware';
import { 
  submitFeedback, 
  getAllFeedback, 
  updateFeedbackStatus, 
  deleteFeedback 
} from '../controllers/feedbackController';

const router = express.Router();

// User routes (Private)
router.post('/', protect, submitFeedback);

// Admin routes (Admin only)
router.get('/admin', protect, isAdmin, getAllFeedback);
router.patch('/admin/:id', protect, isAdmin, updateFeedbackStatus);
router.delete('/admin/:id', protect, isAdmin, deleteFeedback);

export default router;
