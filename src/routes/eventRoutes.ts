import express from 'express';
import { create, getAll, getById, update, remove } from '../controllers/eventController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.route('/')
    .get(getAll) // Public events? Or protected? Requirement: "Public Landing Page". So Public.
    .post(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), create);

router.route('/:id')
    .get(getById)
    .put(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), update)
    .delete(protect, authorize(UserRole.SUPER_ADMIN), remove);

export default router;
