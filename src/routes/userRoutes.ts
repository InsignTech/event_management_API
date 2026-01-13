import express from 'express';
import { getAll, create, update, remove, search } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);

router.get('/search', search);

// Admin only routes
router.use(authorize(UserRole.SUPER_ADMIN));

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
