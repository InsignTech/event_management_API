import express from 'express';
import { register, getRegistrations, getStudentRegistrations, cancelRegistration, deleteRegistration, updateStatus, getAll, updateRegistration, getCollegePrograms, report } from '../controllers/registrationController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR));

router.route('/')
    .get(getAll)
    .post(register);

router.route('/:id')
    .put(updateRegistration)
    .delete(deleteRegistration);

router.post('/:id/cancel', cancelRegistration);
router.patch('/:id/status', updateStatus);
router.post('/:id/report', report);

router.get('/college/:collegeId/programs', getCollegePrograms);

router.route('/program/:programId')
    .get(getRegistrations);

router.route('/student/:studentId')
    .get(getStudentRegistrations);

export default router;
