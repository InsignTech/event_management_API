import express from 'express';
import { getDashboardOverview } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.route('/overview')
    .get(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), getDashboardOverview);

export default router;
