"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.getById = exports.getAll = exports.create = void 0;
const eventService = __importStar(require("../services/eventService"));
const zod_1 = require("zod");
const Event_1 = require("../models/Event");
const createEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    venue: zod_1.z.string().min(3),
    status: zod_1.z.nativeEnum(Event_1.EventStatus).optional(),
});
const updateEventSchema = createEventSchema.partial();
const create = async (req, res) => {
    try {
        const data = createEventSchema.parse(req.body);
        const event = await eventService.createEvent({
            ...data,
            createduserId: req.user._id
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.create = create;
const getAll = async (req, res) => {
    try {
        const events = await eventService.getEvents(req.query);
        res.json({ success: true, data: events });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        res.json({ success: true, data: event });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.getById = getById;
const update = async (req, res) => {
    try {
        const data = updateEventSchema.parse(req.body);
        const event = await eventService.updateEvent(req.params.id, data);
        res.json({ success: true, data: event });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await eventService.deleteEvent(req.params.id);
        res.json({ success: true, message: 'Event removed' });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.remove = remove;
