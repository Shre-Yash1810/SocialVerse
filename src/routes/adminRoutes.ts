import express from 'express';
import { protect, isAdmin, isFounder } from '../middlewares/authMiddleware';
import { 
  getAllUsers, 
  deleteUser, 
  getStats, 
  updateUserRole,
  getAllPosts,
  deleteAdminPost,
  getAllReports,
  resolveReport
} from '../controllers/adminController';

const router = express.Router();

// All routes here should be protected and only accessible by admins/founders
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

// Only a founder can update roles
router.put('/users/:id/role', isFounder, updateUserRole);

export default router;
