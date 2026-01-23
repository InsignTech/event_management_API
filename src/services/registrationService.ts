import Registration, { IRegistration, RegistrationStatus } from '../models/Registration';
import Program, { IProgram } from '../models/Program';
import Student from '../models/Student';
import Score from '../models/Score';
import { updateProgramLeaderboard } from './scoreService';
import mongoose from 'mongoose';

const validateRegistrationParticipants = async (program: IProgram, studentIds: string[]) => {
    if (program.type === 'single' && studentIds.length > 1) {
        throw new Error('A single program can only have one participant');
    }

    if (program.type === 'group') {
        const students = await Student.find({ _id: { $in: studentIds } });
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

export const registerForProgram = async (studentIds: string[], programId: string, createdUserId: string) => {
    // Check if any student is already registered for this program
    const existingRegistration = await Registration.findOne({
        program: programId,
        participants: { $in: studentIds }
    });

    if (existingRegistration) {
        throw new Error('One or more students are already registered for this program');
    }

    // Check if program is published
    const program = await Program.findById(programId);
    if (!program) throw new Error('Program not found');
    if (program.isResultPublished) {
        throw new Error('Cannot register for a program after results are published');
    }

    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);

    const registration = await Registration.create({
        program: programId,
        participants: studentIds as any,
        status: RegistrationStatus.OPEN, // Default status
        createduserId: createdUserId
    });

    return registration;
};

export const getRegistrationsByStudent = async (studentId: string) => {
    return await Registration.find({ participants: studentId }).populate('program');
};

export const getRegistrationsByProgram = async (programId: string, page: number = 1, limit: number = 20, search?: string, status?: string) => {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { program: programId };

    if (status) {
        if (status.includes(',')) {
            query.status = { $in: status.split(',') };
        } else {
            query.status = status;
        }
    }

    if (search) {
        // 1. Search students first
        const matchedStudents = await Student.find({
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
        Registration.find(query)
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate('program') // Ensure program is populated for display
            .sort({ rank: 1, pointsObtained: -1 })
            .skip(skip)
            .limit(limit),
        Registration.countDocuments(query)
    ]);

    const program = await Program.findById(programId).select('name type isResultPublished maxParticipants');
    const event = await mongoose.model('Event').findById(program?.event).select('name');

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

export const getAllRegistrations = async () => {
    return await Registration.find().populate('participants').populate('program');
};

export const updateRegistrationStatus = async (id: string, status: RegistrationStatus) => {
    return await Registration.findByIdAndUpdate(id, { status }, { new: true });
};

export const reportRegistration = async (id: string, chestNumber: string) => {
    // Check if chest number is already taken for this program
    const registration = await Registration.findById(id);
    if (!registration) throw new Error('Registration not found');

    const existing = await Registration.findOne({
        program: registration.program,
        chestNumber,
        _id: { $ne: id }
    });

    if (existing) {
        throw new Error('This chest number is already assigned to another participant in this program');
    }

    return await Registration.findByIdAndUpdate(id, {
        status: RegistrationStatus.REPORTED,
        chestNumber
    }, { new: true });
};

export const cancelRegistration = async (id: string, reason: string) => {
    if (!reason) throw new Error("Cancellation reason is required.");
    return await Registration.findByIdAndUpdate(id, {
        status: RegistrationStatus.CANCELLED,
        cancellationReason: reason
    }, { new: true });
}


export const updateRegistrationParticipants = async (id: string, studentIds: string[]) => {
    const registration = await Registration.findById(id);
    if (!registration) throw new Error('Registration not found');

    const program = await Program.findById(registration.program);
    if (!program) throw new Error('Program not found');

    if (program.isResultPublished) {
        throw new Error('Cannot update registration after results are published');
    }

    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);

    registration.participants = studentIds as any;
    return await registration.save();
};

export const removeRegistration = async (id: string) => {
    const registration = await Registration.findById(id);
    if (!registration) return null;

    const programId = registration.program.toString();

    // Cascading delete scores related to this registration
    await Score.deleteMany({ registration: id });

    // Delete the registration itself
    const result = await Registration.findByIdAndDelete(id);

    // Recalculate the leaderboard for the program
    await updateProgramLeaderboard(programId);

    return result;
};

export const getProgramsByCollege = async (collegeId: string) => {
    // 1. Get all students of this college
    const students = await Student.find({ college: collegeId }).select('_id');
    const studentIds = students.map(s => s._id);

    // 2. Find all registrations for these students
    const registrations = await Registration.find({
        participants: { $in: studentIds }
    }).populate('program');

    // 3. Extract unique programs
    const uniqueProgramsMap = new Map();
    registrations.forEach(reg => {
        if (reg.program) {
            const program = reg.program as any;
            uniqueProgramsMap.set(program._id.toString(), program);
        }
    });

    return Array.from(uniqueProgramsMap.values());
};
