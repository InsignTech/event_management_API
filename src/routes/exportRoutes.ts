import express from 'express';
import {
    exportCollegeWise,
    exportProgramWise,
    exportCollegeWiseParticipantDistinctCount,
    exportCollegeWiseParticipantNonDistinctCount,
    exportStudentRanking,
    exportCollegeLeaderboard,
    exportParticipatedList
} from '../controllers/exportController';

import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.EVENT_ADMIN, UserRole.COORDINATOR, UserRole.REGISTRATION, UserRole.PROGRAM_REPORTING, UserRole.COORDINATOR));

router.get('/college-wise', exportCollegeWise);
router.get('/program-wise/:programId', exportProgramWise);
router.get('/participants-distinct', exportCollegeWiseParticipantDistinctCount);
router.get('/participants-non-distinct', exportCollegeWiseParticipantNonDistinctCount);
router.get('/student-ranking', exportStudentRanking);
router.get('/college-leaderboard', exportCollegeLeaderboard);
router.get('/participants-list', exportParticipatedList);


export default router;

