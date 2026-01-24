import Program, { IProgram } from '../models/Program';

export const createProgram = async (data: Partial<IProgram>) => {
    // Check for duplicate name in same event
    const existingProgram = await Program.findOne({
        event: data.event,
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        isCancelled: { $ne: true }
    });

    if (existingProgram) {
        throw new Error(`A program named "${data.name}" already exists in this event`);
    }

    return await Program.create({
        ...data,
        lastUpdateduserId: data.createduserId
    });
};

export const getProgramsByEvent = async (eventId: string, includeCancelled: boolean = true) => {
    const query: any = { event: eventId };
    if (!includeCancelled) {
        query.isCancelled = false;
    }
    return await Program.find(query).populate('coordinators', 'name email');
};

export const getAllPrograms = async (includeCancelled: boolean = true) => {
    const query = includeCancelled ? {} : { isCancelled: false };
    return await Program.find(query).populate('event').populate('coordinators', 'name email');
};

export const getProgramById = async (id: string) => {
    const program = await Program.findById(id).populate('event').populate('coordinators', 'name email');
    if (!program) throw new Error('Program not found');
    return program;
};

export const updateProgram = async (id: string, data: Partial<IProgram>, userId: string) => {
    const currentProgram = await Program.findById(id);
    if (!currentProgram) throw new Error('Program not found');

    if (currentProgram.isCancelled) {
        throw new Error('Cannot modify a cancelled program');
    }

    if (data.name) {
        const existingProgram = await Program.findOne({
            _id: { $ne: id },
            event: currentProgram.event,
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            isCancelled: { $ne: true }
        });

        if (existingProgram) {
            throw new Error(`A program named "${data.name}" already exists in this event`);
        }
    }

    const program = await Program.findByIdAndUpdate(id, {
        ...data,
        lastUpdateduserId: userId as any
    }, { new: true, runValidators: true });

    if (!program) throw new Error('Program not found');
    return program;
};

export const cancelProgram = async (id: string, reason: string, userId: string) => {
    if (!reason) throw new Error('Cancellation reason is required');

    const program = await Program.findById(id);
    if (!program) throw new Error('Program not found');

    if (program.isResultPublished) {
        throw new Error('Cannot cancel a program after results are published');
    }

    program.isCancelled = true;
    program.cancellationReason = reason;
    program.lastUpdateduserId = userId as any;

    return await program.save();
};

export const deleteProgram = async (id: string) => {
    const program = await Program.findByIdAndDelete(id);
    if (!program) throw new Error('Program not found');
    return program;
};
