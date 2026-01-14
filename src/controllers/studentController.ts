import { Request, Response } from 'express';
import * as studentService from '../services/studentService';
import { z } from 'zod';

const createStudentSchema = z.object({
    name: z.string().optional(),
    college: z.string(),
    universityRegNo: z.string(),
    course: z.string(),
    year: z.string(),
    gender: z.enum(['male', 'female', 'other']),
    emergencyContact: z.string().optional()
});

const updateStudentSchema = createStudentSchema.partial();

export const createStudent = async (req: Request, res: Response) => {
    try {

        const data = createStudentSchema.parse(req.body);

        const student = await studentService.createStudentProfile({
            ...data,
            createduserId: req.user._id,
        } as any);

        res.status(201).json({ success: true, data: student });
    } catch (error: any) {
        console.log(error)
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const getStudents = async (req: Request, res: Response) => {
    try {
        const { college, search, page = 1, limit = 20 } = req.query;

        const filter: any = {};
        if (college) filter.college = college;
        if (search) {
            filter.$or = [
                { universityRegNo: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const { students, totalCount } = await studentService.getAllStudents(filter, {
            skip,
            limit: Number(limit)
        });

        res.json({
            success: true,
            data: students,
            pagination: {
                total: totalCount,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(totalCount / Number(limit))
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        await studentService.deleteStudentProfile(req.params.id);
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudent = async (req: Request, res: Response) => {
    try {
        const student = await studentService.getStudentById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: student });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const data = updateStudentSchema.parse(req.body);
        const student = await studentService.updateStudentProfile(req.params.id, data as any);
        res.json({ success: true, data: student });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

