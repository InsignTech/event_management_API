import express from 'express';
import { register, getRegistrations, getStudentRegistrations, cancelRegistration, deleteRegistration, updateStatus, getAll, updateRegistration, getCollegePrograms, report, getCollegeRegistrations, confirmAllByCollege } from '../controllers/registrationController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);

// Read operations - allow program_reporting
router.route('/')
    .get(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING), getAll)
    .post(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION), register);

router.route('/:id')
    .put(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION), updateRegistration)
    .delete(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION), deleteRegistration);

// Status updates - allow program_reporting
router.post('/:id/cancel', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING), cancelRegistration);
router.patch('/:id/status', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING), updateStatus);
router.post('/:id/report', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING), report);

// Read operations - allow program_reporting
router.get('/college/:collegeId/programs', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING, UserRole.SCORING), getCollegePrograms);
router.get('/college/:collegeId', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING), getCollegeRegistrations);
router.post('/college/:collegeId/confirm-all', authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION), confirmAllByCollege);

router.route('/program/:programId')
    .get(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING, UserRole.SCORING), getRegistrations);

router.route('/student/:studentId')
    .get(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING), getStudentRegistrations);

export default router;
