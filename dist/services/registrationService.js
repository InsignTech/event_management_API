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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramsByCollege = exports.removeRegistration = exports.updateRegistrationParticipants = exports.cancelRegistration = exports.updateRegistrationStatus = exports.getAllRegistrations = exports.getRegistrationsByProgram = exports.getRegistrationsByStudent = exports.registerForProgram = void 0;
const Registration_1 = __importStar(require("../models/Registration"));
const Program_1 = __importDefault(require("../models/Program"));
const Student_1 = __importDefault(require("../models/Student"));
const Score_1 = __importDefault(require("../models/Score"));
const scoreService_1 = require("./scoreService");
const mongoose_1 = __importDefault(require("mongoose"));
const validateRegistrationParticipants = async (program, studentIds) => {
    if (program.type === 'single' && studentIds.length > 1) {
        throw new Error('A single program can only have one participant');
    }
    if (program.type === 'group') {
        const students = await Student_1.default.find({ _id: { $in: studentIds } });
        if (students.length !== studentIds.length) {
            throw new Error('One or more invalid student IDs provided');
        }
        const collegeIds = students.map(s => s.college.toString());
        const allSameCollege = collegeIds.every(id => id === collegeIds[0]);
        if (!allSameCollege) {
            throw new Error('All participants in a group program must be from the same college');
        }
        if (program.maxParticipants && studentIds.length > program.maxParticipants) {
            throw new Error(`Maximum ${program.maxParticipants} participants allowed for this program`);
        }
    }
};
const registerForProgram = async (studentIds, programId, createdUserId) => {
    // Check if any student is already registered for this program
    const existingRegistration = await Registration_1.default.findOne({
        program: programId,
        participants: { $in: studentIds }
    });
    if (existingRegistration) {
        throw new Error('One or more students are already registered for this program');
    }
    // Check if program is published
    const program = await Program_1.default.findById(programId);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot register for a program after results are published');
    }
    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);
    // Atomic Chest Number Generation
    const updatedProgram = await Program_1.default.findByIdAndUpdate(programId, { $inc: { lastChestNumber: 1 } }, { new: true });
    if (!updatedProgram) {
        throw new Error('Program not found');
    }
    const chestNumber = `C${updatedProgram.lastChestNumber}`;
    const registration = await Registration_1.default.create({
        program: programId,
        participants: studentIds,
        chestNumber,
        status: Registration_1.RegistrationStatus.OPEN, // Default status
        createduserId: createdUserId
    });
    return registration;
};
exports.registerForProgram = registerForProgram;
const getRegistrationsByStudent = async (studentId) => {
    return await Registration_1.default.find({ participants: studentId }).populate('program');
};
exports.getRegistrationsByStudent = getRegistrationsByStudent;
const getRegistrationsByProgram = async (programId, page = 1, limit = 20, search) => {
    const skip = (page - 1) * limit;
    // Build query
    const query = { program: programId };
    if (search) {
        // 1. Search students first
        const matchedStudents = await Student_1.default.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { registrationCode: { $regex: search, $options: 'i' } }, // Search by Code
                { phone: { $regex: search, $options: 'i' } } // Search by Phone
            ]
        }).select('_id');
        const matchedStudentIds = matchedStudents.map(s => s._id);
        // 2. Build registration query with $or
        query.$or = [
            { chestNumber: { $regex: search, $options: 'i' } },
            { participants: { $in: matchedStudentIds } }
        ];
    }
    const [registrations, total] = await Promise.all([
        Registration_1.default.find(query)
            .populate({
            path: 'participants',
            populate: { path: 'college' }
        })
            .populate('program') // Ensure program is populated for display
            .sort({ rank: 1, pointsObtained: -1 })
            .skip(skip)
            .limit(limit),
        Registration_1.default.countDocuments(query)
    ]);
    const program = await Program_1.default.findById(programId).select('name type isResultPublished maxParticipants');
    const event = await mongoose_1.default.model('Event').findById(program?.event).select('name');
    return {
        program,
        isResultPublished: program?.isResultPublished || false,
        registrations,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};
exports.getRegistrationsByProgram = getRegistrationsByProgram;
const getAllRegistrations = async () => {
    return await Registration_1.default.find().populate('participants').populate('program');
};
exports.getAllRegistrations = getAllRegistrations;
const updateRegistrationStatus = async (id, status) => {
    return await Registration_1.default.findByIdAndUpdate(id, { status }, { new: true });
};
exports.updateRegistrationStatus = updateRegistrationStatus;
const cancelRegistration = async (id, reason) => {
    if (!reason)
        throw new Error("Cancellation reason is required.");
    return await Registration_1.default.findByIdAndUpdate(id, {
        status: Registration_1.RegistrationStatus.CANCELLED,
        cancellationReason: reason
    }, { new: true });
};
exports.cancelRegistration = cancelRegistration;
const updateRegistrationParticipants = async (id, studentIds) => {
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        throw new Error('Registration not found');
    const program = await Program_1.default.findById(registration.program);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot update registration after results are published');
    }
    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);
    registration.participants = studentIds;
    return await registration.save();
};
exports.updateRegistrationParticipants = updateRegistrationParticipants;
const removeRegistration = async (id) => {
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        return null;
    const programId = registration.program.toString();
    // Cascading delete scores related to this registration
    await Score_1.default.deleteMany({ registration: id });
    // Delete the registration itself
    const result = await Registration_1.default.findByIdAndDelete(id);
    // Recalculate the leaderboard for the program
    await (0, scoreService_1.updateProgramLeaderboard)(programId);
    return result;
};
exports.removeRegistration = removeRegistration;
const getProgramsByCollege = async (collegeId) => {
    // 1. Get all students of this college
    const students = await Student_1.default.find({ college: collegeId }).select('_id');
    const studentIds = students.map(s => s._id);
    // 2. Find all registrations for these students
    const registrations = await Registration_1.default.find({
        participants: { $in: studentIds }
    }).populate('program');
    // 3. Extract unique programs
    const uniqueProgramsMap = new Map();
    registrations.forEach(reg => {
        if (reg.program) {
            const program = reg.program;
            uniqueProgramsMap.set(program._id.toString(), program);
        }
    });
    return Array.from(uniqueProgramsMap.values());
};
exports.getProgramsByCollege = getProgramsByCollege;
