import Program, { IProgram } from '../models/Program';

export const createProgram = async (data: Partial<IProgram>) => {
    // Can add logic to check venue overlap against other programs in the same event
    return await Program.create(data);
};

export const getProgramsByEvent = async (eventId: string) => {
    return await Program.find({ event: eventId }).populate('coordinators', 'name email');
};

export const getAllPrograms = async () => {
    return await Program.find().populate('event').populate('coordinators', 'name email');
};

export const getProgramById = async (id: string) => {
    const program = await Program.findById(id).populate('event').populate('coordinators', 'name email');
    if (!program) throw new Error('Program not found');
    return program;
};

export const updateProgram = async (id: string, data: Partial<IProgram>) => {
    const program = await Program.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!program) throw new Error('Program not found');
    return program;
};

export const deleteProgram = async (id: string) => {
    const program = await Program.findByIdAndDelete(id);
    if (!program) throw new Error('Program not found');
    return program;
};
