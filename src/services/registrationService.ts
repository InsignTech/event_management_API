import Registration, { IRegistration } from '../models/Registration';
import Program, { IProgram } from '../models/Program';
import Student from '../models/Student';

export const registerForProgram = async (studentIds: string[], programId: string) => {
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
    });

    return registration;
};

export const getRegistrationsByStudent = async (studentId: string) => {
    return await Registration.find({ participants: studentId }).populate('program');
};

export const getRegistrationsByProgram = async (programId: string) => {
    return await Registration.find({ program: programId }).populate('participants'); // Populate participants profile
};

export const getAllRegistrations = async () => {
    return await Registration.find().populate('participants').populate('program');
};

export const removeRegistration = async (id: string) => {
    return await Registration.findByIdAndDelete(id);
};

