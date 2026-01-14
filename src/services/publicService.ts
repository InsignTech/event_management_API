import Registration from '../models/Registration';
import College from '../models/College';
import Program from '../models/Program';
import mongoose from 'mongoose';

export const getPublicSchedule = async () => {
    return await Program.find()
        .populate('event', 'name')
        .sort({ startTime: 1 });
};

export const getPublicLeaderboard = async () => {
    // Points system: Rank 1: 5pts, Rank 2: 3pts, Rank 3: 1pt

    const registrations = await Registration.find({
        rank: { $in: [1, 2, 3] },
        status: 'completed'
    }).populate({
        path: 'participants',
        select: 'college',
        populate: { path: 'college', select: 'name logo' }
    });

    const collegePoints: Record<string, { name: string, logo?: string, points: number }> = {};

    registrations.forEach(reg => {
        const student = (reg.participants as any)[0];
        if (!student || !student.college) return;

        const college = student.college;
        const collegeId = college._id.toString();

        if (!collegePoints[collegeId]) {
            collegePoints[collegeId] = {
                name: college.name,
                logo: college.logo,
                points: 0
            };
        }

        if (reg.rank === 1) collegePoints[collegeId].points += 5;
        else if (reg.rank === 2) collegePoints[collegeId].points += 3;
        else if (reg.rank === 3) collegePoints[collegeId].points += 1;
    });

    return Object.values(collegePoints).sort((a, b) => b.points - a.points);
};
