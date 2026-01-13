import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as authService from '../services/authService';
import { z } from 'zod';
import { UserRole } from '../models/User';

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole).optional(),
    phone: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial();

export const getAll = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const data = createUserSchema.parse(req.body);
        const user = await authService.registerUser(data);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const data = updateUserSchema.parse(req.body);
        const user = await userService.updateUser(req.params.id, data as any);
        res.json({ success: true, data: user });
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
        await userService.softDeleteUser(req.params.id);
        res.json({ success: true, message: 'User removed (soft-deleted)' });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const search = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const users = await userService.searchUsers(query);
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
