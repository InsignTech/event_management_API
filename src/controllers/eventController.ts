import { Request, Response } from 'express';
import * as eventService from '../services/eventService';
import { z } from 'zod';
import { EventStatus } from '../models/Event';

const createEventSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    venue: z.string().min(3),
    status: z.nativeEnum(EventStatus).optional(),
});

const updateEventSchema = createEventSchema.partial();

export const create = async (req: Request, res: Response) => {
    try {
        const data = createEventSchema.parse(req.body);
        const event = await eventService.createEvent(data);
        res.status(201).json({ success: true, data: event });
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
        const events = await eventService.getEvents(req.query);
        res.json({ success: true, data: events });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        res.json({ success: true, data: event });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const data = updateEventSchema.parse(req.body);
        const event = await eventService.updateEvent(req.params.id, data);
        res.json({ success: true, data: event });
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
        await eventService.deleteEvent(req.params.id);
        res.json({ success: true, message: 'Event removed' });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};
