import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService';

export const getDashboardOverview = async (req: Request, res: Response) => {
    try {
        const [stats, recentRegistrations, eventStatus] = await Promise.all([
            dashboardService.getStats(),
            dashboardService.getRecentRegistrations(5),
            dashboardService.getEventStatus()
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats,
                recentRegistrations,
                eventStatus
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
