import express from 'express';
import { search } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/search', protect, search);

export default router;
