import express from 'express';
import { exportCollegeWise, exportProgramWise } from '../controllers/exportController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR,  UserRole.REGISTRATION,  UserRole.PROGRAM_REPORTING, UserRole.COORDINATOR));

router.get('/college-wise', exportCollegeWise);
router.get('/program-wise/:programId', exportProgramWise);

export default router;
