import Program, { IProgram } from '../models/Program';
import Registration, { RegistrationStatus } from '../models/Registration';
import { sendScheduleChangeNotification, sendProgramCancelledNotification, sendProgramReminderNotification } from '../utils/whatsapp';
import mongoose from 'mongoose';


export const triggerAllFutureReminders = async () => {
    try {
        const now = new Date();
        // Find programs starting after now that are not cancelled
        const upcomingPrograms = await Program.find({
            startTime: { $gt: now },
            isCancelled: { $ne: true }
        });

        if (!upcomingPrograms.length) return { sentCount: 0, programCount: 0 };

        let totalSent = 0;
        const processedPhones = new Set<string>();

        for (const program of upcomingPrograms) {
            const startTime = new Date(program.startTime);
            const programDate = startTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
            const timeStr = startTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

            // Get all registrations for this program
            const registrations = await Registration.find({
                program: program._id,
                status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.REPORTED, RegistrationStatus.OPEN] }
            }).populate('participants');

            for (const reg of registrations) {
                const participants = reg.participants as any[];
                for (const student of participants) {
                    if (student.phone && !processedPhones.has(`${program._id}-${student.phone}`)) {
                        const sent = await sendProgramReminderNotification(student.phone, {
                            programName: program.name,
                            date: programDate,
                            venue: program.venue,
                            time: timeStr,
                            reminderTime: "30 mins"
                        });
                        if (sent) totalSent++;
                        processedPhones.add(`${program._id}-${student.phone}`);
                    }
                }
            }
        }

        return { sentCount: totalSent, programCount: upcomingPrograms.length };
    } catch (error) {
        console.error('Error in triggerAllFutureReminders:', error);
        throw error;
    }
};


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

    // if (isScheduleChanged) {
    //     triggerScheduleChangeWhatsApp(program._id.toString()).catch(err =>
    //         console.error('Failed to trigger schedule change WhatsApp:', err)
    //     );
    // }

    return program;
};

const triggerScheduleChangeWhatsApp = async (programId: string, isCancellation: boolean = false) => {
    try {
        const registrations = await Registration.find({
            program: programId,
            status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.REPORTED, RegistrationStatus.OPEN] }
        })
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate({
                path: 'program',
                populate: { path: 'coordinators' }
            });

        if (!registrations.length) {
            // If no registrations, at least try to notify the program's own coordinators
            const program = await Program.findById(programId).populate('coordinators');
            if (program && program.coordinators) {
                const startTime = new Date(program.startTime);
                const programDate = startTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
                const time = startTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
                const dateTimeString = `${programDate} ${time}`;

                for (const coord of (program.coordinators as any[])) {
                    if (coord.phone) {
                        if (isCancellation) {
                            await sendProgramCancelledNotification(coord.phone, {
                                programName: program.name,
                                dateTime: dateTimeString,
                                venue: program.venue
                            });
                        } else {
                            await sendScheduleChangeNotification(coord.phone, {
                                programName: program.name,
                                date: programDate,
                                time: time,
                                venue: program.venue
                            });
                        }
                    }
                }

            }
            return;
        }

        const program = registrations[0].program as any;
        const startTime = new Date(program.startTime);
        const programDate = startTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        const time = startTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

        // Formatted date and time for cancellation template parameter 2
        const dateTimeString = `${programDate} ${time}`;

        const processedPhones = new Set<string>();
        const collegeCoordinators = new Map<string, any>(); // collegeId -> { phone, name }

        const sendNotify = async (phone: string) => {
            if (isCancellation) {
                await sendProgramCancelledNotification(phone, {
                    programName: program.name,
                    dateTime: dateTimeString,
                    venue: program.venue
                });
            } else {
                await sendScheduleChangeNotification(phone, {
                    programName: program.name,
                    date: programDate,
                    time: time,
                    venue: program.venue
                });
            }
        };

        // 1. Notify Participants
        for (const reg of registrations) {
            const participants = reg.participants as any[];
            for (const student of participants) {
                if (student.phone && !processedPhones.has(student.phone)) {
                    await sendNotify(student.phone);
                    processedPhones.add(student.phone);
                }


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

        // 2. Notify College Coordinators
        for (const [collegeId, coordinator] of collegeCoordinators) {
            if (coordinator.phone && !processedPhones.has(coordinator.phone)) {
                await sendNotify(coordinator.phone);
                processedPhones.add(coordinator.phone);
            }
        }

        // 3. Notify Program Coordinators (Staff)
        if (program.coordinators) {
            for (const coord of (program.coordinators as any[])) {
                if (coord.phone && !processedPhones.has(coord.phone)) {
                    await sendNotify(coord.phone);
                    processedPhones.add(coord.phone);
                }
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

    const updated = await program.save();

    // Trigger WhatsApp for cancellation
    // triggerScheduleChangeWhatsApp(updated._id.toString(), true).catch(err =>
    //     console.error('Failed to trigger cancellation WhatsApp:', err)
    // );

    return updated;
};


export const deleteProgram = async (id: string) => {
    const program = await Program.findByIdAndDelete(id);
    if (!program) throw new Error('Program not found');
    return program;
};
