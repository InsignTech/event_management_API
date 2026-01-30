import { Request, Response } from 'express';
import * as publicService from '../services/publicService';
import Program from '../models/Program';
import College from '../models/College';
import {
    sendCoordinatorNotification,
    sendStudentNotification,
    sendScheduleChangeNotification,
    sendProgramReminderNotification
} from '../utils/whatsapp';

export const getSchedule = async (req: Request, res: Response) => {
    try {
        const schedule = await publicService.getPublicSchedule();
        res.json({ success: true, data: schedule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await publicService.getPublicStats();
        res.json({ success: true, data: stats });
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

export const getPrograms = async (req: Request, res: Response) => {
    try {
        const programs = await publicService.getPublicPrograms();
        res.json({ success: true, data: programs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProgramResults = async (req: Request, res: Response) => {
    try {
        const { programId } = req.params;
        const results = await publicService.getProgramResults(programId);
        res.json({ success: true, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const testWhatsApp = async (req: Request, res: Response) => {
    try {
        const testNumber = '7558978583';
        const program = await Program.findOne({ isCancelled: { $ne: true } }).sort({ createdAt: -1 });

        if (!program) {
            return res.status(404).json({ success: false, message: 'No program found for testing' });
        }

        // Mock/Fetch some context
        const college = await College.findOne() || { name: 'Test College' };

        const startTime = new Date(program.startTime);
        const programDate = startTime.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').reverse().join('-');

        const timeStr = startTime.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const results: any = {};

        // 1. Test Registration - Coordinator
        results.registration_coordinator = await sendCoordinatorNotification(testNumber, {
            collegeName: (college as any).name,
            programName: program.name,
            programDate,
            venue: program.venue,
            time: timeStr
        });

        // 2. Test Registration - Student
        results.registration_student = await sendStudentNotification(testNumber, {
            studentName: "Test Participant",
            collegeName: (college as any).name,
            programName: program.name,
            programDate,
            venue: program.venue,
            time: timeStr
        });

        // 3. Test Schedule Change
        results.schedule_change = await sendScheduleChangeNotification(testNumber, {
            programName: program.name,
            date: programDate,
            time: timeStr,
            venue: program.venue
        });

        // 4. Test Program Reminder
        results.reminder = await sendProgramReminderNotification(testNumber, {
            programName: program.name,
            date: programDate,
            venue: program.venue,
            time: timeStr,
            reminderTime: "60"
        });

        res.json({
            success: true,
            message: "Test messages triggered to 7558978583",
            data_used: {
                program: program.name,
                date: programDate,
                time: timeStr
            },
            results
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentRanking = async (req: Request, res: Response) => {
    try {
        const { gender } = req.query;
        const ranking = await publicService.getStudentRanking(gender as string);
        res.json({ success: true, data: ranking });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
