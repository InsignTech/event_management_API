import express from 'express';
import { submit, getLeaderboard } from '../controllers/scoreController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.route('/submit')
    .post(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), submit);

router.route('/leaderboard')
    .get(getLeaderboard); // Public leaderboard

export default router;
