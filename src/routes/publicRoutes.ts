import express from 'express';
import { getSchedule, getLeaderboard } from '../controllers/publicController';

const router = express.Router();

router.get('/schedule', getSchedule);
router.get('/leaderboard', getLeaderboard);

export default router;
