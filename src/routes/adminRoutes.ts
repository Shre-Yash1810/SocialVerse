import express from 'express';
import { protect, isAdmin, isFounder } from '../middlewares/authMiddleware';
import { 
  getAllUsers, 
  deleteUser, 
  getStats, 
  updateUserRole,
  toggleUserVerification,
  toggleUserBan,
  getAllPosts,
  deleteAdminPost,
  getAllReports,
  resolveReport
} from '../controllers/adminController';

const router = express.Router();

// All routes below are protected and only accessible by admins/founders
router.use(protect);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.get('/stats', getStats);
router.delete('/users/:id', deleteUser);

// New Moderation Routes
router.get('/posts', getAllPosts);
router.delete('/posts/:id', deleteAdminPost);

// New Reporting Routes
router.get('/reports', getAllReports);
router.put('/reports/:id', resolveReport);

// Only a founder/admin can toggle verification, ban, or role
router.put('/users/:id/verify', toggleUserVerification);
router.put('/users/:id/ban', toggleUserBan);
router.put('/users/:id/role', updateUserRole);

export default router;
