"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.createEvent = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const createEvent = async (data) => {
    const existing = await Event_1.default.findOne({ name: data.name });
    if (existing) {
        throw new Error('Event already exists');
    }
    return await Event_1.default.create(data);
};
exports.createEvent = createEvent;
const getEvents = async (query = {}) => {
    return await Event_1.default.find(query);
};
exports.getEvents = getEvents;
const getEventById = async (id) => {
    const event = await Event_1.default.findById(id);
    if (!event)
        throw new Error('Event not found');
    return event;
};
exports.getEventById = getEventById;
const updateEvent = async (id, data) => {
    const event = await Event_1.default.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!event)
        throw new Error('Event not found');
    return event;
};
exports.updateEvent = updateEvent;
const deleteEvent = async (id) => {
    const event = await Event_1.default.findByIdAndDelete(id);
    if (!event)
        throw new Error('Event not found');
    return event;
};
exports.deleteEvent = deleteEvent;
