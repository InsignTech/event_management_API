"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProgram = exports.updateProgram = exports.getProgramById = exports.getAllPrograms = exports.getProgramsByEvent = exports.createProgram = void 0;
const Program_1 = __importDefault(require("../models/Program"));
const createProgram = async (data) => {
    // Check for duplicate name in same event
    const existingProgram = await Program_1.default.findOne({
        event: data.event,
        name: { $regex: new RegExp(`^${data.name}$`, 'i') }
    });
    if (existingProgram) {
        throw new Error(`A program named "${data.name}" already exists in this event`);
    }
    return await Program_1.default.create(data);
};
exports.createProgram = createProgram;
const getProgramsByEvent = async (eventId) => {
    return await Program_1.default.find({ event: eventId }).populate('coordinators', 'name email');
};
exports.getProgramsByEvent = getProgramsByEvent;
const getAllPrograms = async () => {
    return await Program_1.default.find().populate('event').populate('coordinators', 'name email');
};
exports.getAllPrograms = getAllPrograms;
const getProgramById = async (id) => {
    const program = await Program_1.default.findById(id).populate('event').populate('coordinators', 'name email');
    if (!program)
        throw new Error('Program not found');
    return program;
};
exports.getProgramById = getProgramById;
const updateProgram = async (id, data) => {
    if (data.name) {
        const currentProgram = await Program_1.default.findById(id);
        if (!currentProgram)
            throw new Error('Program not found');
        const existingProgram = await Program_1.default.findOne({
            _id: { $ne: id },
            event: currentProgram.event,
            name: { $regex: new RegExp(`^${data.name}$`, 'i') }
        });
        if (existingProgram) {
            throw new Error(`A program named "${data.name}" already exists in this event`);
        }
    }
    const program = await Program_1.default.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!program)
        throw new Error('Program not found');
    return program;
};
exports.updateProgram = updateProgram;
const deleteProgram = async (id) => {
    const program = await Program_1.default.findByIdAndDelete(id);
    if (!program)
        throw new Error('Program not found');
    return program;
};
exports.deleteProgram = deleteProgram;
