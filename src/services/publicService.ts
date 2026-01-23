import Registration, { RegistrationStatus } from '../models/Registration';
import College from '../models/College';
import Program from '../models/Program';
import mongoose from 'mongoose';

export const getPublicSchedule = async () => {
    return await Program.find()
        .populate('event', 'name')
        .sort({ startTime: 1 });
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

    // 3. Fetch completed registrations with rank 1, 2, or 3 for PUBLISHED programs only
    const publishedPrograms = await Program.find({ isResultPublished: true }).select('_id');
    const publishedProgramIds = publishedPrograms.map(p => p._id);

    const registrations = await Registration.find({
        program: { $in: publishedProgramIds },
        rank: { $in: [1, 2, 3] },
        status: RegistrationStatus.COMPLETED
    }).populate({
        path: 'participants',
        select: 'college',
        populate: { path: 'college', select: 'name logo' }
    });

    // 4. Calculate points for each college
    registrations.forEach(reg => {
        const student = (reg.participants as any)[0];
        if (!student || !student.college) return;

        const collegeId = student.college._id.toString();

        // Safety check if college exists in our initial list
        if (collegePoints[collegeId]) {
            if (reg.rank === 1) collegePoints[collegeId].points += 5;
            else if (reg.rank === 2) collegePoints[collegeId].points += 3;
            else if (reg.rank === 3) collegePoints[collegeId].points += 1;
        }
    });

    // 5. Convert to array and sort
    const sortedStandings = Object.values(collegePoints).sort((a, b) => b.points - a.points);

    // 6. Assign ranks (handling ties)
    let currentRank = 1;
    return sortedStandings.map((standing, index) => {
        if (index > 0 && standing.points < sortedStandings[index - 1].points) {
            currentRank = index + 1;
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

    return await Registration.find({
        program: programId,
        rank: { $in: [1, 2, 3] },
        status: RegistrationStatus.COMPLETED
    })
        .sort({ rank: 1 })
        .populate({
            path: 'participants',
            select: 'name college chestNumber',
            populate: {
                path: 'college',
                select: 'name logo'
            }
        });
};
