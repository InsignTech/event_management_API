import express from 'express';
import { addToBlacklist, checkBlacklist, getAllBlacklisted, removeFromBlacklist } from '../controllers/blacklistController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), getAllBlacklisted)
    .post(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR), addToBlacklist);

router.get('/check/:phone', checkBlacklist);

router.delete('/:phone', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), removeFromBlacklist);

export default router;
