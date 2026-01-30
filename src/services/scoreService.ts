import mongoose from 'mongoose';
import Score, { IScore } from '../models/Score';
import Registration, { RegistrationStatus } from '../models/Registration';
import College from '../models/College';
import Program from '../models/Program';
import { sendResultPublishedNotification } from '../utils/whatsapp';

interface ScoreInput {
    programId: string;
    registrationId: string;
    judgeId: string;
    criteria: Record<string, number>;
}

// Helper to calculate ranks dynamically based on pointsObtained
export const calculateRanks = <T extends { pointsObtained?: number }>(items: T[]): (T & { rank: number })[] => {
    // 1. Sort by pointsObtained descending
    const sorted = [...items].sort((a, b) => (b.pointsObtained || 0) - (a.pointsObtained || 0));

    // 2. Assign ranks handling ties (Dense Ranking)
    let currentRank = 1;
    return sorted.map((item, index) => {
        const score = Math.round((item.pointsObtained || 0) * 10000) / 10000;
        if (index > 0) {
            const prevScore = Math.round((sorted[index - 1].pointsObtained || 0) * 10000) / 10000;
            if (score < prevScore) {
                currentRank += 1;
            }
        }
        return { ...item, rank: currentRank };
    });
};

// Publish results for a program
export const publishResults = async (programId: string, userId: string) => {
    const program = await Program.findById(programId);
    if (!program) throw new Error('Program not found');

    program.isResultPublished = true;
    program.lastUpdateduserId = userId as any;
    await program.save();

    // Ensure all ranks are calculated and finalized
    await updateProgramLeaderboard(programId);

    // Trigger WhatsApp notifications
    // triggerResultPublishedWhatsApp(programId).catch(err =>
    //     console.error('Failed to trigger result published WhatsApp:', err)
    // );
};

const triggerResultPublishedWhatsApp = async (programId: string) => {
    try {
        const registrations = await Registration.find({ program: programId })
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate('program');

        if (!registrations.length) return;

        const program = await Program.findById(programId);
        if (!program) return;

        const processedPhones = new Set<string>();
        const collegeCoordinators = new Map<string, any>(); // collegeId -> coordinatorPhone

        for (const reg of registrations) {
            const participants = reg.participants as any[];
            for (const student of participants) {
                // 1. Notify Participant
                if (student.phone && !processedPhones.has(student.phone)) {
                    await sendResultPublishedNotification(student.phone, {
                        programName: program.name
                    });
                    processedPhones.add(student.phone);
                }

                // 2. Collect College Coordinators
                if (student.college && student.college.coordinatorPhone) {
                    const collegeId = student.college._id.toString();
                    if (!collegeCoordinators.has(collegeId)) {
                        collegeCoordinators.set(collegeId, student.college.coordinatorPhone);
                    }
                }
            }
        }

        // 3. Notify College Coordinators
        for (const [collegeId, phone] of collegeCoordinators) {
            if (phone && !processedPhones.has(phone)) {
                await sendResultPublishedNotification(phone, {
                    programName: program.name
                });
                processedPhones.add(phone);
            }
        }

    } catch (error) {
        console.error('Error in triggerResultPublishedWhatsApp:', error);
    }
};


export const submitScore = async (input: ScoreInput) => {
    // Check if program results are published
    const program = await Program.findById(input.programId);
    if (!program) throw new Error('Program not found');

    console.log('SubmitScore Program Check:', { programId: input.programId, isPublished: program.isResultPublished });

    if (program.isResultPublished) {
        throw new Error('Cannot edit scores after results are published');
    }

    const totalPoints = Object.values(input.criteria).reduce((a, b) => a + b, 0);



    const score = await Score.findOneAndUpdate(
        {
            program: input.programId,
            registration: input.registrationId,
            judgeId: input.judgeId,
        },
        {
            criteria: input.criteria,
            totalPoints,
        },
        { new: true, upsert: true }
    );

    // TODO: Trigger Leaderboard Recalculation (Async)
    await updateProgramLeaderboard(input.programId);

    return score;
};

// Recalculate ranks for a program
export const updateProgramLeaderboard = async (programId: string) => {
    // 1. Aggregate scores by registration
    const results = await Score.aggregate([
        { $match: { program: new mongoose.Types.ObjectId(programId) } },
        {
            $group: {
                _id: '$registration',
                avgScore: { $avg: '$totalPoints' }, // Average across judges
            },
        },
        { $sort: { avgScore: -1 } },
    ]);

    if (results.length === 0) return;

    // 2. Sort in memory to ensure absolute consistency
    results.sort((a, b) => b.avgScore - a.avgScore);

    for (let i = 0; i < results.length; i++) {
        await Registration.findByIdAndUpdate(results[i]._id, {
            pointsObtained: results[i].avgScore,
            status: RegistrationStatus.COMPLETED
        });
    }
}

export const getLeaderboard = async () => {
    // Aggregate overall college points based on top 3 ranks ONLY for published programs
    // Logic: Rank 1 = 10pts, Rank 2 = 5pts, Rank 3 = 3pts (Configurable)

    // This is a simplified fetch. Real aggregation would be complex.
    // We will return list of colleges sorted by their total accumulated points from students.
    return await College.find().sort({ points: -1 }); // Assuming College has points field, or we aggregate on fly
};
