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
exports.getProgramsByCollege = exports.removeRegistration = exports.updateRegistrationParticipants = exports.cancelRegistration = exports.reportRegistration = exports.updateRegistrationStatus = exports.getAllRegistrations = exports.getRegistrationsByProgram = exports.getRegistrationsByStudent = exports.registerForProgram = void 0;
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
    if (program.isCancelled) {
        throw new Error('Cannot register for a cancelled program');
    }
    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);
    const registration = await Registration_1.default.create({
        program: programId,
        participants: studentIds,
        status: Registration_1.RegistrationStatus.OPEN, // Default status
        createduserId: createdUserId,
        lastUpdateduserId: createdUserId
    });
    return registration;
};
exports.registerForProgram = registerForProgram;
const getRegistrationsByStudent = async (studentId) => {
    return await Registration_1.default.find({ participants: studentId }).populate('program');
};
exports.getRegistrationsByStudent = getRegistrationsByStudent;
const getRegistrationsByProgram = async (programId, page = 1, limit = 20, search, status) => {
    const skip = (page - 1) * limit;
    // Build query
    const query = { program: programId };
    if (status) {
        if (status.includes(',')) {
            query.status = { $in: status.split(',') };
        }
        else {
            query.status = status;
        }
    }
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
    // We fetch ALL registrations for the program to calculate ranks accurately, 
    // or we fetch only the current page if ranking is purely based on current page points (which is unlikely).
    // Given the leaderboard logic, we should probably calculate ranks across all completions in the program.
    const allRegistrations = await Registration_1.default.find({ program: programId, status: Registration_1.RegistrationStatus.COMPLETED })
        .populate({
        path: 'participants',
        populate: { path: 'college' }
    })
        .populate('program')
        .sort({ pointsObtained: -1 });
    const rankedAll = (0, scoreService_1.calculateRanks)(allRegistrations.map(r => r.toObject()));
    // Now apply filters and pagination on the ranked set for the return value
    // However, the query might have filters (status besides completed, search).
    // Let's stick to the current approach but inject rank.
    const [registrations, total] = await Promise.all([
        Registration_1.default.find(query)
            .populate({
            path: 'participants',
            populate: { path: 'college' }
        })
            .populate('program') // Ensure program is populated for display
            .sort({ pointsObtained: -1 })
            .skip(skip)
            .limit(limit),
        Registration_1.default.countDocuments(query)
    ]);
    // Inject rank into the paginated results by looking up in the full ranked list
    const resultsWithRank = registrations.map(reg => {
        const regObj = reg.toObject();
        const found = rankedAll.find(r => r._id.toString() === regObj._id.toString());
        return {
            ...regObj,
            rank: found ? found.rank : undefined
        };
    });
    const program = await Program_1.default.findById(programId).select('name type isResultPublished maxParticipants isCancelled cancellationReason');
    const event = await mongoose_1.default.model('Event').findById(program?.event).select('name');
    return {
        program,
        isResultPublished: program?.isResultPublished || false,
        registrations: resultsWithRank,
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
const updateRegistrationStatus = async (id, status, userId) => {
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        throw new Error('Registration not found');
    const program = await Program_1.default.findById(registration.program);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot update registration status after results are published');
    }
    if (program.isCancelled) {
        throw new Error('Cannot update registration status for a cancelled program');
    }
    if (registration.status === Registration_1.RegistrationStatus.CANCELLED || registration.status === Registration_1.RegistrationStatus.REJECTED) {
        throw new Error('Cannot update a cancelled or rejected registration');
    }
    registration.status = status;
    registration.lastUpdateduserId = userId;
    return await registration.save();
};
exports.updateRegistrationStatus = updateRegistrationStatus;
const reportRegistration = async (id, chestNumber, userId) => {
    // Check if chest number is already taken for this program
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        throw new Error('Registration not found');
    const program = await Program_1.default.findById(registration.program);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot report registration after results are published');
    }
    if (program.isCancelled) {
        throw new Error('Cannot report registration for a cancelled program');
    }
    if (registration.status === Registration_1.RegistrationStatus.CANCELLED || registration.status === Registration_1.RegistrationStatus.REJECTED) {
        throw new Error('Cannot report a cancelled or rejected registration');
    }
    const existing = await Registration_1.default.findOne({
        program: registration.program,
        chestNumber,
        _id: { $ne: id }
    });
    if (existing) {
        throw new Error('This chest number is already assigned to another participant in this program');
    }
    registration.status = Registration_1.RegistrationStatus.REPORTED;
    registration.chestNumber = chestNumber;
    registration.lastUpdateduserId = userId;
    return await registration.save();
};
exports.reportRegistration = reportRegistration;
const cancelRegistration = async (id, reason, userId) => {
    if (!reason)
        throw new Error("Cancellation reason is required.");
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        throw new Error('Registration not found');
    const program = await Program_1.default.findById(registration.program);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot cancel registration after results are published');
    }
    if (program.isCancelled) {
        throw new Error('Cannot cancel registration for a cancelled program');
    }
    if (registration.status === Registration_1.RegistrationStatus.CANCELLED || registration.status === Registration_1.RegistrationStatus.REJECTED) {
        throw new Error('This registration is already cancelled or rejected');
    }
    registration.status = Registration_1.RegistrationStatus.CANCELLED;
    registration.cancellationReason = reason;
    registration.lastUpdateduserId = userId;
    return await registration.save();
};
exports.cancelRegistration = cancelRegistration;
const updateRegistrationParticipants = async (id, studentIds, userId) => {
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        throw new Error('Registration not found');
    const program = await Program_1.default.findById(registration.program);
    if (!program)
        throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot update registration after results are published');
    }
    if (program.isCancelled) {
        throw new Error('Cannot update registration for a cancelled program');
    }
    if (registration.status === Registration_1.RegistrationStatus.CANCELLED || registration.status === Registration_1.RegistrationStatus.REJECTED) {
        throw new Error('Cannot update a cancelled or rejected registration');
    }
    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);
    registration.participants = studentIds;
    registration.lastUpdateduserId = userId;
    return await registration.save();
};
exports.updateRegistrationParticipants = updateRegistrationParticipants;
const removeRegistration = async (id, userId) => {
    const registration = await Registration_1.default.findById(id);
    if (!registration)
        return null;
    const program = await Program_1.default.findById(registration.program);
    if (program?.isResultPublished) {
        throw new Error('Cannot delete registration after results are published');
    }
    if (program?.isCancelled) {
        throw new Error('Cannot delete registration for a cancelled program');
    }
    if (registration.status === Registration_1.RegistrationStatus.CANCELLED || registration.status === Registration_1.RegistrationStatus.REJECTED) {
        throw new Error('Cannot delete a cancelled or rejected registration');
    }
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
