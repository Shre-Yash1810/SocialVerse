import express from 'express';
import { getNearbyUsers, updateLocation, toggleDiscovery, waveAtUser } from '../controllers/discoveryController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/nearby', protect, getNearbyUsers);
router.post('/location', protect, updateLocation);
router.post('/toggle', protect, toggleDiscovery);
router.post('/wave/:targetId', protect, waveAtUser);

export default router;
