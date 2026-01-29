import { Request, Response } from 'express';
import * as programService from '../services/programService';
import * as scoreService from '../services/scoreService';
import { z } from 'zod';
import { ProgramType, ProgramCategory } from '../models/Program';

const createProgramSchema = z.object({
    event: z.string(),
    name: z.string().min(3),
    type: z.nativeEnum(ProgramType).optional(),
    category: z.nativeEnum(ProgramCategory),
    venue: z.string(),
    startTime: z.coerce.date(),
    duration: z.number().nonnegative().nullable(),
    maxParticipants: z.number().optional(),
    genderRestriction: z.enum(['male', 'female', 'none']).optional(),
    rules: z.array(z.string()).optional(),
    coordinators: z.array(z.string()).optional(),
});

const updateProgramSchema = createProgramSchema.partial();

export const create = async (req: Request, res: Response) => {
    try {
        const data = createProgramSchema.parse(req.body);
        const program = await programService.createProgram({
            ...data,
            createduserId: req.user._id
        } as any);
        res.status(201).json({ success: true, data: program });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const getByEvent = async (req: Request, res: Response) => {
    try {
        const includeCancelled = req.query.includeCancelled === 'true';
        const programs = await programService.getProgramsByEvent(req.params.eventId, includeCancelled);
        res.json({ success: true, data: programs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const includeCancelled = req.query.includeCancelled === 'true';
        const programs = await programService.getAllPrograms(includeCancelled);
        res.json({ success: true, data: programs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const program = await programService.getProgramById(req.params.id);
        res.json({ success: true, data: program });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const data = updateProgramSchema.parse(req.body);
        const userId = req.user._id;
        const program = await programService.updateProgram(req.params.id, data as any, userId);
        res.json({ success: true, data: program });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        await programService.deleteProgram(req.params.id);
        res.json({ success: true, message: 'Program removed' });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const cancel = async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;
        const userId = req.user._id;
        const program = await programService.cancelProgram(req.params.id, reason, userId);
        res.json({ success: true, data: program });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const publish = async (req: Request, res: Response) => {
    try {
        await scoreService.publishResults(req.params.id, req.user._id);
        res.json({ success: true, message: 'Results published successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};


export const triggerReminders = async (req: Request, res: Response) => {
    try {
        const result = await programService.triggerAllFutureReminders();
        res.json({
            success: true,
            message: `Sent ${result.sentCount} reminders for ${result.programCount} upcoming programs.`
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const triggerSingleReminder = async (req: Request, res: Response) => {
    try {
        const sentCount = await programService.triggerProgramReminderNotification(req.params.id);
        res.json({
            success: true,
            message: `Sent ${sentCount} reminders for the program.`
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

