import Registration, { IRegistration, RegistrationStatus } from '../models/Registration';
import Program, { IProgram } from '../models/Program';
import Student from '../models/Student';
import Score from '../models/Score';
import { updateProgramLeaderboard, calculateRanks } from './scoreService';
import mongoose from 'mongoose';
import { sendCoordinatorNotification, sendStudentNotification } from '../utils/whatsapp';
import College from '../models/College';

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

    if (program.isCancelled) {
        throw new Error('Cannot register for a cancelled program');
    }

    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);

    const registration = await Registration.create({
        program: programId,
        participants: studentIds as any,
        status: RegistrationStatus.OPEN, // Default status
        createduserId: createdUserId,
        lastUpdateduserId: createdUserId
    });

    return registration;
};

export const getRegistrationsByStudent = async (studentId: string) => {
    return await Registration.find({ participants: studentId }).populate('program');
};

export const getRegistrationsByProgram = async (programId: string, page: number = 1, limit: number = 20, search?: string, status?: string, collegeId?: string) => {
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

    if (search || collegeId) {
        const studentQuery: any = {};
        if (collegeId) studentQuery.college = collegeId;
        if (search) {
            studentQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registrationCode: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const matchedStudents = await Student.find(studentQuery).select('_id');
        const matchedStudentIds = matchedStudents.map(s => s._id);

        if (search) {
            const conditions: any[] = [
                {
                    $or: [
                        { chestNumber: { $regex: search, $options: 'i' } },
                        { participants: { $in: matchedStudentIds } }
                    ]
                }
            ];

            if (collegeId) {
                const collegeStudents = await Student.find({ college: collegeId }).select('_id');
                const collegeStudentIds = collegeStudents.map(s => s._id);
                conditions.push({ participants: { $in: collegeStudentIds } });
            }

            query.$and = conditions;
        } else {
            query.participants = { $in: matchedStudentIds };
        }
    }

    // We fetch ALL registrations for the program to calculate ranks accurately, 
    // or we fetch only the current page if ranking is purely based on current page points (which is unlikely).
    // Given the leaderboard logic, we should probably calculate ranks across all completions in the program.

    const allRegistrations = await Registration.find({ program: programId, status: RegistrationStatus.COMPLETED })
        .populate({
            path: 'participants',
            populate: { path: 'college' }
        })
        .populate('program')
        .sort({ pointsObtained: -1 });

    const rankedAll = calculateRanks(allRegistrations.map(r => r.toObject()));

    // Now apply filters and pagination on the ranked set for the return value
    // However, the query might have filters (status besides completed, search).
    // Let's stick to the current approach but inject rank.

    const [registrations, total] = await Promise.all([
        Registration.find(query)
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate('program') // Ensure program is populated for display
            .sort({ pointsObtained: -1 })
            .skip(skip)
            .limit(limit),
        Registration.countDocuments(query)
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

    const program = await Program.findById(programId).select('name type isResultPublished maxParticipants isCancelled cancellationReason');
    const event = await mongoose.model('Event').findById(program?.event).select('name');

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

export const getAllRegistrations = async () => {
    return await Registration.find().populate('participants').populate('program');
};

export const updateRegistrationStatus = async (id: string, status: RegistrationStatus, userId: string) => {
    const registration = await Registration.findById(id);
    if (!registration) throw new Error('Registration not found');

    const program = await Program.findById(registration.program);
    if (!program) throw new Error('Program not found');

    if (program.isResultPublished) {
        throw new Error('Cannot update registration status after results are published');
    }

    if (program.isCancelled) {
        throw new Error('Cannot update registration status for a cancelled program');
    }

    if (registration.status === RegistrationStatus.CANCELLED || registration.status === RegistrationStatus.REJECTED) {
        throw new Error('Cannot update a cancelled or rejected registration');
    }

    registration.status = status;
    registration.lastUpdateduserId = userId as any;
    const updated = await registration.save();

    // Trigger WhatsApp if moving to CONFIRMED
    if (status === RegistrationStatus.CONFIRMED) {
        triggerWhatsAppForRegistration(updated._id).catch(err => console.error('WhatsApp trigger error:', err));
    }

    return updated;
};

const triggerWhatsAppForRegistration = async (registrationId: string | mongoose.Types.ObjectId) => {
    try {
        const reg = await Registration.findById(registrationId)
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate('program');

        if (!reg || !reg.program || !reg.participants.length) return;

        const program = reg.program as any;
        const participants = reg.participants as any[];

        // Get college details from first participant's college
        const college = participants[0]?.college;
        const collegeName = college?.name || 'MES Youth Fest';

        const startTime = new Date(program.startTime);
        const programDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // HH:MM AM/PM

        // 1. Notify Coordinator
        if (college?.coordinatorPhone) {
            await sendCoordinatorNotification(college.coordinatorPhone, {
                collegeName,
                programName: program.name,
                programDate,
                venue: program.venue,
                time
            });
        }

        // 2. Notify Participants
        for (const student of participants) {
            if (student.phone) {
                await sendStudentNotification(student.phone, {
                    studentName: student.name || 'Participant',
                    collegeName,
                    programName: program.name,
                    programDate,
                    venue: program.venue,
                    time
                });
            }
        }
    } catch (error) {
        console.error('Error in triggerWhatsAppForRegistration:', error);
    }
};

export const reportRegistration = async (id: string, chestNumber: string, userId: string) => {
    // Check if chest number is already taken for this program
    const registration = await Registration.findById(id);
    if (!registration) throw new Error('Registration not found');

    const program = await Program.findById(registration.program);
    if (!program) throw new Error('Program not found');

    if (program.isResultPublished) {
        throw new Error('Cannot report registration after results are published');
    }

    if (program.isCancelled) {
        throw new Error('Cannot report registration for a cancelled program');
    }

    if (registration.status === RegistrationStatus.CANCELLED || registration.status === RegistrationStatus.REJECTED) {
        throw new Error('Cannot report a cancelled or rejected registration');
    }

    const existing = await Registration.findOne({
        program: registration.program,
        chestNumber,
        _id: { $ne: id }
    });

    if (existing) {
        throw new Error('This chest number is already assigned to another participant in this program');
    }

    registration.status = RegistrationStatus.REPORTED;
    registration.chestNumber = chestNumber;
    registration.lastUpdateduserId = userId as any;

    return await registration.save();
};

export const cancelRegistration = async (id: string, reason: string, userId: string) => {
    if (!reason) throw new Error("Cancellation reason is required.");

    const registration = await Registration.findById(id);
    if (!registration) throw new Error('Registration not found');

    const program = await Program.findById(registration.program);
    if (!program) throw new Error('Program not found');

    if (program.isResultPublished) {
        throw new Error('Cannot cancel registration after results are published');
    }

    if (program.isCancelled) {
        throw new Error('Cannot cancel registration for a cancelled program');
    }

    if (registration.status === RegistrationStatus.CANCELLED || registration.status === RegistrationStatus.REJECTED) {
        throw new Error('This registration is already cancelled or rejected');
    }

    registration.status = RegistrationStatus.CANCELLED;
    registration.cancellationReason = reason;
    registration.lastUpdateduserId = userId as any;

    return await registration.save();
}


export const updateRegistrationParticipants = async (id: string, studentIds: string[], userId: string) => {
    const registration = await Registration.findById(id);
    if (!registration) throw new Error('Registration not found');

    const program = await Program.findById(registration.program);
    if (!program) throw new Error('Program not found');

    if (program.isResultPublished) {
        throw new Error('Cannot update registration after results are published');
    }

    if (program.isCancelled) {
        throw new Error('Cannot update registration for a cancelled program');
    }

    if (registration.status === RegistrationStatus.CANCELLED ||
        registration.status === RegistrationStatus.REJECTED ||
        registration.status === RegistrationStatus.REPORTED ||
        registration.status === RegistrationStatus.PARTICIPATED) {
        throw new Error(`Cannot update a ${registration.status} registration`);
    }

    // Comprehensive Validation
    await validateRegistrationParticipants(program, studentIds);

    registration.participants = studentIds as any;
    registration.lastUpdateduserId = userId as any;
    return await registration.save();
};

export const removeRegistration = async (id: string, userId: string) => {
    const registration = await Registration.findById(id);
    if (!registration) return null;

    const program = await Program.findById(registration.program);
    if (program?.isResultPublished) {
        throw new Error('Cannot delete registration after results are published');
    }

    if (program?.isCancelled) {
        throw new Error('Cannot delete registration for a cancelled program');
    }

    if (registration.status === RegistrationStatus.CANCELLED || registration.status === RegistrationStatus.REJECTED) {
        throw new Error('Cannot delete a cancelled or rejected registration');
    }

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

    // Define status priority (lower value = lower status)
    const statusPriority: Record<string, number> = {
        [RegistrationStatus.OPEN]: 1,
        [RegistrationStatus.CONFIRMED]: 2,
        [RegistrationStatus.REPORTED]: 3,
        [RegistrationStatus.PARTICIPATED]: 4,
        [RegistrationStatus.ABSENT]: 5,
        [RegistrationStatus.COMPLETED]: 6,
        [RegistrationStatus.CANCELLED]: 7,
        [RegistrationStatus.REJECTED]: 8,
    };

    // 3. Extract unique programs and collect statuses
    const programDataMap = new Map<string, { program: any, statuses: Set<string> }>();

    registrations.forEach(reg => {
        if (reg.program) {
            const programId = (reg.program as any)._id.toString();
            if (!programDataMap.has(programId)) {
                programDataMap.set(programId, {
                    program: (reg.program as any).toObject(),
                    statuses: new Set<string>()
                });
            }
            programDataMap.get(programId)?.statuses.add(reg.status);
        }
    });

    // 4. Calculate aggregate status for each program
    return Array.from(programDataMap.values()).map(({ program, statuses }) => {
        const statusList = Array.from(statuses);

        // Find the "lowest" status based on priority
        let lowestStatus = statusList[0];
        let minPriority = statusPriority[lowestStatus] || 99;

        statusList.forEach(status => {
            const priority = statusPriority[status] || 99;
            if (priority < minPriority) {
                minPriority = priority;
                lowestStatus = status;
            }
        });

        return {
            ...program,
            collegeStatus: lowestStatus
        };
    });
};

export const getRegistrationsByCollege = async (collegeId: string, status?: string, programId?: string) => {
    const students = await Student.find({ college: collegeId }).select('_id');
    const studentIds = students.map(s => s._id);

    const query: any = {
        participants: { $in: studentIds }
    };

    if (status) {
        query.status = status;
    }

    if (programId) {
        query.program = programId;
    }

    return await Registration.find(query)
        .populate('program')
        .populate('participants')
        .sort({ registeredAt: -1 });
};
export const confirmAllByCollege = async (collegeId: string, userId: string) => {
    const students = await Student.find({ college: collegeId }).select('_id');
    const studentIds = students.map(s => s._id);

    // Find registrations that will be updated to send WhatsApp later
    const registrationsToConfirm = await Registration.find({
        participants: { $in: studentIds },
        status: RegistrationStatus.OPEN
    }).select('_id');

    const result = await Registration.updateMany(
        {
            participants: { $in: studentIds },
            status: RegistrationStatus.OPEN
        },
        {
            status: RegistrationStatus.CONFIRMED,
            lastUpdateduserId: userId as any
        }
    );

    // Trigger WhatsApp for each confirmed registration
    if (registrationsToConfirm.length > 0) {
        registrationsToConfirm.forEach(reg => {
            triggerWhatsAppForRegistration(reg._id).catch(err => console.error('Bulk WhatsApp trigger error:', err));
        });
    }

    return result;
};
