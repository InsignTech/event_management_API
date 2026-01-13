import Registration, { IRegistration } from '../models/Registration';
import Program, { IProgram } from '../models/Program';
import Student from '../models/Student';
import Score from '../models/Score';
import { updateProgramLeaderboard } from './scoreService';

export const registerForProgram = async (studentIds: string[], programId: string, createdUserId: string) => {
    // Check if any student is already registered for this program
    const existingRegistration = await Registration.findOne({
        program: programId,
        participants: { $in: studentIds }
    });

    if (existingRegistration) {
        throw new Error('One or more students are already registered for this program');
    }

    // Atomic Chest Number Generation
    const updatedProgram = await Program.findByIdAndUpdate(
        programId,
        { $inc: { lastChestNumber: 1 } },
        { new: true }
    );

    if (!updatedProgram) {
        throw new Error('Program not found');
    }

    const chestNumber = `C${updatedProgram.lastChestNumber}`;

    const registration = await Registration.create({
        program: programId,
        participants: studentIds as any,
        chestNumber,
        createduserId: createdUserId
    });

    return registration;
};

export const getRegistrationsByStudent = async (studentId: string) => {
    return await Registration.find({ participants: studentId }).populate('program');
};

export const getRegistrationsByProgram = async (programId: string, page: number = 1, limit: number = 20, search?: string) => {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { program: programId };

    if (search) {
        // 1. Search students first
        const matchedStudents = await Student.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { universityRegNo: { $regex: search, $options: 'i' } }
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
            .populate('participants')
            .populate('program') // Ensure program is populated for display
            .sort({ rank: 1, pointsObtained: -1 })
            .skip(skip)
            .limit(limit),
        Registration.countDocuments(query)
    ]);

    return {
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

