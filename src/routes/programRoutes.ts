import express from 'express';
import { create, getByEvent, getById, update, remove, getAll } from '../controllers/programController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Programs are usually fetched by Event
router.route('/event/:eventId')
    .get(getByEvent);

router.route('/')
    .get(getAll)
    .post(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), create);

router.route('/:id')
    .get(getById)
    .put(protect, authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN), update)
    .delete(protect, authorize(UserRole.SUPER_ADMIN), remove);

export default router;
