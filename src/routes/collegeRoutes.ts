import express from 'express';
import { create, getAll, getById, update, remove } from '../controllers/collegeController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.route('/')
    .get(protect, getAll)
    .post(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), create);

router.route('/:id')
    .get(protect, getById)
    .put(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), update)
    .delete(protect, authorize(UserRole.SUPER_ADMIN), remove);

export default router;
