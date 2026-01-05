import { Request, Response } from 'express';
import * as collegeService from '../services/collegeService';
import { z } from 'zod';
import { CollegeStatus } from '../models/College';

// Validation Schemas
const createCollegeSchema = z.object({
    name: z.string().min(3),
    address: z.string().min(5),
    coordinatorName: z.string().min(2),
    coordinatorEmail: z.string().email(),
    coordinatorPhone: z.string().min(10),
    logo: z.string().url().optional(),
    status: z.nativeEnum(CollegeStatus).optional(),
});

const updateCollegeSchema = createCollegeSchema.partial();

export const create = async (req: Request, res: Response) => {
    try {
        const data = createCollegeSchema.parse(req.body);
        const college = await collegeService.createCollege(data);
        res.status(201).json({ success: true, data: college });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const colleges = await collegeService.getColleges();
        res.json({ success: true, data: colleges });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const college = await collegeService.getCollegeById(req.params.id);
        res.json({ success: true, data: college });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        // Check if user is authorized later (context-aware), for now only Admin access in routes handles it
        const data = updateCollegeSchema.parse(req.body);
        const college = await collegeService.updateCollege(req.params.id, data);
        res.json({ success: true, data: college });
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
        await collegeService.deleteCollege(req.params.id);
        res.json({ success: true, message: 'College removed' });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};
