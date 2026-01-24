"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProgram = exports.cancelProgram = exports.updateProgram = exports.getProgramById = exports.getAllPrograms = exports.getProgramsByEvent = exports.createProgram = void 0;
const Program_1 = __importDefault(require("../models/Program"));
const createProgram = async (data) => {
    // Check for duplicate name in same event
    const existingProgram = await Program_1.default.findOne({
        event: data.event,
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        isCancelled: { $ne: true }
    });
    if (existingProgram) {
        throw new Error(`A program named "${data.name}" already exists in this event`);
    }
    return await Program_1.default.create({
        ...data,
        lastUpdateduserId: data.createduserId
    });
};
exports.createProgram = createProgram;
const getProgramsByEvent = async (eventId, includeCancelled = true) => {
    let query = { event: eventId };
    if (!includeCancelled) {
        // Include only non-cancelled programs and old records without isCancelled field (treat as non-cancelled)
        query = {
            event: eventId,
            $or: [
                { isCancelled: false },
                { isCancelled: { $exists: false } }
            ]
        };
    }
    return await Program_1.default.find(query).populate('coordinators', 'name email');
};
exports.getProgramsByEvent = getProgramsByEvent;
const getAllPrograms = async (includeCancelled = true) => {
    let query = {};
    if (!includeCancelled) {
        // Include only non-cancelled programs and old records without isCancelled field (treat as non-cancelled)
        query = {
            $or: [
                { isCancelled: false },
                { isCancelled: { $exists: false } }
            ]
        };
    }
    return await Program_1.default.find(query).populate('event').populate('coordinators', 'name email');
};
exports.getAllPrograms = getAllPrograms;
const getProgramById = async (id) => {
    const program = await Program_1.default.findById(id).populate('event').populate('coordinators', 'name email');
    if (!program)
        throw new Error('Program not found');
    return program;
};
exports.getProgramById = getProgramById;
const updateProgram = async (id, data, userId) => {
    const currentProgram = await Program_1.default.findById(id);
    if (!currentProgram)
        throw new Error('Program not found');
    if (currentProgram.isCancelled) {
        throw new Error('Cannot modify a cancelled program');
    }
    if (data.name) {
        const existingProgram = await Program_1.default.findOne({
            _id: { $ne: id },
            event: currentProgram.event,
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            isCancelled: { $ne: true }
        });
        if (existingProgram) {
            throw new Error(`A program named "${data.name}" already exists in this event`);
        }
    }
    const program = await Program_1.default.findByIdAndUpdate(id, {
        ...data,
        lastUpdateduserId: userId
    }, { new: true, runValidators: true });
    if (!program)
        throw new Error('Program not found');
    return program;
};
exports.updateProgram = updateProgram;
const cancelProgram = async (id, reason, userId) => {
    if (!reason)
        throw new Error('Cancellation reason is required');
    const program = await Program_1.default.findById(id);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot cancel a program after results are published');
    }
    program.isCancelled = true;
    program.cancellationReason = reason;
    program.lastUpdateduserId = userId;
    return await program.save();
};
exports.cancelProgram = cancelProgram;
const deleteProgram = async (id) => {
    const program = await Program_1.default.findByIdAndDelete(id);
    if (!program)
        throw new Error('Program not found');
    return program;
};
exports.deleteProgram = deleteProgram;
