import Registration, { RegistrationStatus } from '../models/Registration';
import College from '../models/College';
import Program, { ProgramType } from '../models/Program';
import mongoose from 'mongoose';
import { calculateRanks } from './scoreService';
import Student from '../models/Student';
import EventModel from '../models/Event';

export const getPublicSchedule = async () => {
    // 1. Get all active events
    const activeEvents = await mongoose.model('Event').find({ isActive: true }).select('_id');
    const activeEventIds = activeEvents.map(e => e._id);

    // 2. Return programs for active events that are not cancelled
    return await Program.find({
        event: { $in: activeEventIds },
        isCancelled: { $ne: true }
    })
        .populate('event', 'name')
        .sort({ startTime: 1 });
};

export const getPublicStats = async () => {
    const [totalColleges, totalPrograms, totalStudents, totalRegistrations] = await Promise.all([
        College.countDocuments(),
        Program.countDocuments({ isCancelled: { $ne: true } }),
        Student.countDocuments(),
        Registration.countDocuments({ status: { $ne: 'cancelled' } })
    ]);

    return {
        totalColleges,
        totalPrograms,
        totalStudents,
        totalRegistrations
    };
};

export const getPublicLeaderboard = async () => {
    // 1. Fetch all colleges to ensure everyone is listed
    const allColleges = await College.find({}).select('name logo');

    // 2. Initialize point mapping with all colleges
    const collegePoints: Record<string, { name: string, logo?: string, points: number }> = {};

    allColleges.forEach(college => {
        collegePoints[college._id.toString()] = {
            name: college.name,
            logo: college.logo,
            points: 0
        };
    });

    // 3. Fetch completed registrations for PUBLISHED programs only
    const publishedPrograms = await Program.find({ isResultPublished: true }).select('_id type');
    const publishedProgramIds = publishedPrograms.map(p => p._id);
    const programTypeMap: Record<string, string> = {};
    publishedPrograms.forEach(prog => {
        programTypeMap[prog._id.toString()] = prog.type;
    });

    const registrations = await Registration.find({
        program: { $in: publishedProgramIds },
        status: RegistrationStatus.COMPLETED
    }).populate({
        path: 'participants',
        select: 'college',
        populate: { path: 'college', select: 'name logo' }
    });

    // 4. Calculate dynamic ranks for each program and aggregate points
    const registrationsByProgram: Record<string, any[]> = {};
    registrations.forEach(reg => {
        const progId = reg.program.toString();
        if (!registrationsByProgram[progId]) registrationsByProgram[progId] = [];
        registrationsByProgram[progId].push(reg.toObject());
    });

    Object.entries(registrationsByProgram).forEach(([progId, progRegs]) => {
        const programType = programTypeMap[progId];
        const isGroup = programType === 'GROUP' || programType === 'Group' || programType === 'group';

        const rankedRegs = calculateRanks(progRegs);
        rankedRegs.forEach(reg => {
            if (reg.rank > 3) return; // Only top 3 get points

            const student = (reg.participants as any)[0];
            if (!student || !student.college) return;

            const collegeId = student.college._id.toString();

            // Safety check if college exists in our initial list
            if (collegePoints[collegeId]) {
                if (isGroup) {
                    if (reg.rank === 1) collegePoints[collegeId].points += 30;
                    else if (reg.rank === 2) collegePoints[collegeId].points += 20;
                    else if (reg.rank === 3) collegePoints[collegeId].points += 10;
                } else {
                    if (reg.rank === 1) collegePoints[collegeId].points += 15;
                    else if (reg.rank === 2) collegePoints[collegeId].points += 10;
                    else if (reg.rank === 3) collegePoints[collegeId].points += 5;
                }
            }
        });
    });

    // 5. Convert to array and sort
    const sortedStandings = Object.values(collegePoints).sort((a, b) => b.points - a.points);

    // 6. Assign ranks (handling ties)
    let currentRank = 1;
    return sortedStandings.map((standing, index) => {
        if (index > 0 && standing.points < sortedStandings[index - 1].points) {
            currentRank += 1;
        }
        return {
            ...standing,
            rank: currentRank
        };
    });
};

export const getPublicPrograms = async () => {
    return await Program.find({ isResultPublished: true })
        .sort({ name: 1 })
        .select('name type category event')
        .populate('event', 'name');
};

export const getProgramResults = async (programId: string) => {
    const program = await Program.findById(programId);
    if (!program || !program.isResultPublished) return [];

    const registrations = await Registration.find({
        program: programId,
        status: RegistrationStatus.COMPLETED
    }).populate({
        path: 'participants',
        select: 'name college registrationCode',
        populate: {
            path: 'college',
            select: 'name logo'
        }
    });

    const ranked = calculateRanks(registrations.map(r => r.toObject()));

    // Return top 3
    return ranked.filter(r => r.rank <= 3).sort((a, b) => a.rank - b.rank);
};

export const getStudentRanking = async (gender?: string) => {
    // 1. Get all published programs of type SINGLE (Individual)
    const programs = await Program.find({
        type: ProgramType.SINGLE,
        isResultPublished: true
    });
    const programIds = programs.map(p => p._id);

    if (!programIds.length) {
        return [];
    }

    // 2. Get all completed registrations for these programs
    const registrations = await Registration.find({
        program: { $in: programIds },
        status: RegistrationStatus.COMPLETED
    }).populate({
        path: 'participants',
        match: gender && gender !== 'all' ? { gender: gender.toString().toLowerCase() } : {},
        populate: { path: 'college', select: 'name logo' }
    });

    // 3. Group by program to calculate ranks
    const registrationsByProgram: Record<string, any[]> = {};
    registrations.forEach(reg => {
        const progId = reg.program.toString();
        if (!registrationsByProgram[progId]) registrationsByProgram[progId] = [];
        registrationsByProgram[progId].push(reg.toObject());
    });

    const studentScores = new Map<string, { student: any, points: number, breakdown: any[] }>();

    Object.entries(registrationsByProgram).forEach(([progId, regs]) => {
        const ranked = calculateRanks(regs);
        ranked.forEach(reg => {
            if (reg.rank > 3) return; // Only top 3 ranks count for student individual points

            // Standard Point System for Individual Items: 1st=5, 2nd=3, 3rd=1
            const points = reg.rank === 1 ? 5 : reg.rank === 2 ? 3 : 1;

            // SINGLE programs always have exactly 1 participant in the array
            // If Match fails (gender), student will be null
            const student = reg.participants[0];

            if (!student) return;

            const studentId = student._id.toString();
            if (!studentScores.has(studentId)) {
                studentScores.set(studentId, { student, points: 0, breakdown: [] });
            }

            const entry = studentScores.get(studentId)!;
            entry.points += points;
            entry.breakdown.push({
                programName: programs.find(p => p._id.toString() === progId)?.name,
                rank: reg.rank,
                points
            });
        });
    });

    const sortedStudents = Array.from(studentScores.values()).sort((a, b) => b.points - a.points);

    let currentRank = 1;
    return sortedStudents.map((entry, index) => {
        if (index > 0 && entry.points < sortedStudents[index - 1].points) {
            currentRank += 1;
        }
        return {
            rank: currentRank,
            student: entry.student,
            points: entry.points,
            breakdown: entry.breakdown
        };
    });
};
