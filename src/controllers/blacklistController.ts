import { Request, Response } from 'express';
import Blacklist from '../models/Blacklist';

/**
 * @desc    Add a phone number to the blacklist
 * @route   POST /api/blacklist
 * @access  Private/Admin (assuming protection needed)
 */
export const addToBlacklist = async (req: Request, res: Response) => {
    try {
        const { phone, reason } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Check if already blacklisted to avoid unique constraint error
        const existing = await Blacklist.findOne({ phone });
        if (existing) {
            return res.status(200).json({ success: true, message: 'Number is already blacklisted', data: existing });
        }

        const entry = await Blacklist.create({
            phone,
            reason
        });

        res.status(201).json({
            success: true,
            message: 'Phone number added to blacklist',
            data: entry
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Check if a phone number is blacklisted
 * @route   GET /api/blacklist/check/:phone
 * @access  Private
 */
export const checkBlacklist = async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;

        const entry = await Blacklist.findOne({ phone });

        res.status(200).json({
            success: true,
            isBlacklisted: !!entry,
            data: entry
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all blacklisted numbers
 * @route   GET /api/blacklist
 * @access  Private/Admin
 */
export const getAllBlacklisted = async (req: Request, res: Response) => {
    try {
        const entries = await Blacklist.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Remove a phone number from the blacklist
 * @route   DELETE /api/blacklist/:phone
 * @access  Private/Admin
 */
export const removeFromBlacklist = async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;
        await Blacklist.findOneAndDelete({ phone });
        res.status(200).json({ success: true, message: 'Phone number removed from blacklist' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
