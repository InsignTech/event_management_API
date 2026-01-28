import Program, { IProgram } from '../models/Program';
import Registration from '../models/Registration';
import { sendScheduleChangeNotification } from '../utils/whatsapp';
import mongoose from 'mongoose';


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
    let query: any = { event: eventId };
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
    return await Program.find(query).populate('coordinators', 'name email');
};

export const getAllPrograms = async (includeCancelled: boolean = true) => {
    let query: any = {};
    if (!includeCancelled) {
        // Include only non-cancelled programs and old records without isCancelled field (treat as non-cancelled)
        query = {
            $or: [
                { isCancelled: false },
                { isCancelled: { $exists: false } }
            ]
        };
    }
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

    // Check if schedule or venue changed
    const isScheduleChanged =
        (data.startTime && new Date(data.startTime).getTime() !== new Date(currentProgram.startTime).getTime()) ||
        (data.venue && data.venue !== currentProgram.venue);


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

    if (isScheduleChanged) {
        triggerScheduleChangeWhatsApp(program._id.toString()).catch(err =>
            console.error('Failed to trigger schedule change WhatsApp:', err)
        );
    }

    return program;
};

const triggerScheduleChangeWhatsApp = async (programId: string) => {
    try {
        const registrations = await Registration.find({ program: programId })
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate('program');

        if (!registrations.length) return;

        const program = registrations[0].program as any;
        const startTime = new Date(program.startTime);
        const programDate = startTime.toISOString().split('T')[0];
        const time = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });


        const processedPhones = new Set<string>();
        const collegeCoordinators = new Map<string, any>(); // collegeId -> { phone, name }

        for (const reg of registrations) {
            const participants = reg.participants as any[];
            for (const student of participants) {
                // 1. Notify Participant
                if (student.phone && !processedPhones.has(student.phone)) {
                    await sendScheduleChangeNotification(student.phone, {
                        programName: program.name,
                        date: programDate,
                        time: time,
                        venue: program.venue
                    });
                    processedPhones.add(student.phone);
                }

                // 2. Collect College Coordinators
                if (student.college && student.college.coordinatorPhone) {
                    const collegeId = student.college._id.toString();
                    if (!collegeCoordinators.has(collegeId)) {
                        collegeCoordinators.set(collegeId, {
                            phone: student.college.coordinatorPhone,
                            name: student.college.name
                        });
                    }
                }
            }
        }

        // 3. Notify College Coordinators
        for (const [collegeId, coordinator] of collegeCoordinators) {
            if (coordinator.phone && !processedPhones.has(coordinator.phone)) {
                await sendScheduleChangeNotification(coordinator.phone, {
                    programName: program.name,
                    date: programDate,
                    time: time,
                    venue: program.venue
                });
                processedPhones.add(coordinator.phone);
            }
        }

    } catch (error) {
        console.error('Error in triggerScheduleChangeWhatsApp:', error);
    }
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
