import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { UserRole } from '../models/User';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole).optional(),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const user = await authService.registerUser(validatedData);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await authService.loginUser(email, password);
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(401).json({ success: false, message: error.message });
    }
};

export const getMe = async (req: Request, res: Response) => {
    res.json({ success: true, data: req.user });
};
