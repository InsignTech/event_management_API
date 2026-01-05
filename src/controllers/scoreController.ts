import { Request, Response } from 'express';
import * as scoreService from '../services/scoreService';
import { z } from 'zod';

const scoreSchema = z.object({
    programId: z.string(),
    registrationId: z.string(),
    criteria: z.record(z.string(), z.number()),
});

export const submit = async (req: Request, res: Response) => {
    try {
        const data = scoreSchema.parse(req.body);
        // judgeId from logged in user (Admin/Event Admin acting as Judge)
        const judgeId = req.user._id.toString();

        const score = await scoreService.submitScore({
            programId: data.programId,
            registrationId: data.registrationId,
            judgeId,
            criteria: data.criteria as unknown as Record<string, number>
        });
        res.status(201).json({ success: true, data: score });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            // Handle unique index error (Judge already scored)
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        // TODO: Implement full leaderboard fetch
        // For now returning empty or mocked
        const leaderboard = await scoreService.getLeaderboard();
        res.json({ success: true, data: leaderboard });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
