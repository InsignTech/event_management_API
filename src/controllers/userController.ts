import { Request, Response } from 'express';
import * as userService from '../services/userService';

export const search = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const users = await userService.searchUsers(query);
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
