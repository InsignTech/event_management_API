import { Request, Response } from 'express';
import * as registrationService from '../services/registrationService';
import { z } from 'zod';

const registerSchema = z.object({
    program: z.string(),
    participants: z.array(z.string()).min(1),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { program: programId, participants } = registerSchema.parse(req.body);
        const createdUserId = req.user._id;
        // Fetch program to check type
        const { getProgramById } = await import('../services/programService');
        const program = await getProgramById(programId);

        if (program.type === 'single' && participants.length > 1) {
            return res.status(400).json({ success: false, message: 'Single program can only have one participant' });
        }

        const registration = await registrationService.registerForProgram(participants, programId, createdUserId);

        // Generate QR
        const { generateQRCode } = await import('../utils/qrcode');
        const qrCodeDataUrl = await generateQRCode((registration as any)._id.toString());

        res.status(201).json({ success: true, data: { ...(registration as any).toObject(), qrCode: qrCodeDataUrl } });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const getRegistrations = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const result = await registrationService.getRegistrationsByProgram(req.params.programId, page, limit, search);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const registrations = await registrationService.getAllRegistrations();
        res.json({ success: true, data: registrations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentRegistrations = async (req: Request, res: Response) => {
    try {
        const registrations = await registrationService.getRegistrationsByStudent(req.params.studentId);
        res.json({ success: true, data: registrations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelRegistration = async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;
        await registrationService.cancelRegistration(req.params.id, reason);
        res.json({ success: true, message: 'Registration cancelled' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteRegistration = async (req: Request, res: Response) => {
    try {
        await registrationService.removeRegistration(req.params.id);
        res.json({ success: true, message: 'Registration deleted permanently' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        // Validate status enum? Zod or service level check. Service should handle basic, but let's be safe.
        // Assuming service handles basic validation or mongoose will error if invalid enum
        const registration = await registrationService.updateRegistrationStatus(req.params.id, status);
        res.json({ success: true, data: registration });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateRegistrationSchema = z.object({
    participants: z.array(z.string()).min(1),
});

export const updateRegistration = async (req: Request, res: Response) => {
    try {
        const { participants } = updateRegistrationSchema.parse(req.body);
        const registration = await registrationService.updateRegistrationParticipants(req.params.id, participants);
        res.json({ success: true, data: registration });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
export const getCollegePrograms = async (req: Request, res: Response) => {
    try {
        const programs = await registrationService.getProgramsByCollege(req.params.collegeId);
        res.json({ success: true, data: programs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
