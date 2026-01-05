import express from 'express';
import { createStudent, getStudents, getStudent, updateStudent, deleteStudent } from '../controllers/studentController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect); // All routes require login
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR));

router.route('/')
    .get(getStudents)
    .post(createStudent);

router.route('/:id')
    .get(getStudent)
    .put(updateStudent)
    .delete(deleteStudent);


export default router;
