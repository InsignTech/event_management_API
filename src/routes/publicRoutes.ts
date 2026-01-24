import express from 'express';
import { getSchedule, getLeaderboard, getPrograms, getProgramResults, getStats } from '../controllers/publicController';

const router = express.Router();

router.get('/schedule', getSchedule);
router.get('/stats', getStats);
router.get('/leaderboard', getLeaderboard);
router.get('/programs', getPrograms);
router.get('/results/:programId', getProgramResults);

export default router;
