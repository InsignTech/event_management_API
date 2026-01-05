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

        // Fetch program to check type
        const { getProgramById } = await import('../services/programService');
        const program = await getProgramById(programId);

        if (program.type === 'single' && participants.length > 1) {
            return res.status(400).json({ success: false, message: 'Single program can only have one participant' });
        }

        const registration = await registrationService.registerForProgram(participants, programId);

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
        const registrations = await registrationService.getRegistrationsByProgram(req.params.programId);
        res.json({ success: true, data: registrations });
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
        await registrationService.removeRegistration(req.params.id);
        res.json({ success: true, message: 'Registration cancelled' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

