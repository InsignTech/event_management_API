import { Request, Response } from 'express';
import * as publicService from '../services/publicService';

export const getSchedule = async (req: Request, res: Response) => {
    try {
        const schedule = await publicService.getPublicSchedule();
        res.json({ success: true, data: schedule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const leaderboard = await publicService.getPublicLeaderboard();
        res.json({ success: true, data: leaderboard });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
