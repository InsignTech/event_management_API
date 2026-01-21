import Program, { IProgram } from '../models/Program';

export const createProgram = async (data: Partial<IProgram>) => {
    // Check for duplicate name in same event
    const existingProgram = await Program.findOne({
        event: data.event,
        name: { $regex: new RegExp(`^${data.name}$`, 'i') }
    });

    if (existingProgram) {
        throw new Error(`A program named "${data.name}" already exists in this event`);
    }

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
    if (data.name) {
        const currentProgram = await Program.findById(id);
        if (!currentProgram) throw new Error('Program not found');

        const existingProgram = await Program.findOne({
            _id: { $ne: id },
            event: currentProgram.event,
            name: { $regex: new RegExp(`^${data.name}$`, 'i') }
        });

        if (existingProgram) {
            throw new Error(`A program named "${data.name}" already exists in this event`);
        }
    }

    const program = await Program.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!program) throw new Error('Program not found');
    return program;
};

export const deleteProgram = async (id: string) => {
    const program = await Program.findByIdAndDelete(id);
    if (!program) throw new Error('Program not found');
    return program;
};
