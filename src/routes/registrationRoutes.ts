import express from 'express';
import { register, getRegistrations, getStudentRegistrations, cancelRegistration, getAll } from '../controllers/registrationController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR));

router.route('/')
    .get(getAll)
    .post(register);

router.route('/:id')
    .delete(cancelRegistration);

router.route('/program/:programId')
    .get(getRegistrations);

router.route('/student/:studentId')
    .get(getStudentRegistrations);

export default router;
