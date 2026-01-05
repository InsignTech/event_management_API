import mongoose from 'mongoose';
import Score, { IScore } from '../models/Score';
import Registration from '../models/Registration';
import College from '../models/College';

interface ScoreInput {
    programId: string;
    registrationId: string;
    judgeId: string;
    criteria: Record<string, number>;
}

export const submitScore = async (input: ScoreInput) => {
    const totalPoints = Object.values(input.criteria).reduce((a, b) => a + b, 0);

    const score = await Score.create({
        program: input.programId,
        registration: input.registrationId,
        judgeId: input.judgeId,
        criteria: input.criteria,
        totalPoints,
    });

    // TODO: Trigger Leaderboard Recalculation (Async)
    await updateProgramLeaderboard(input.programId);

    return score;
};

// Recalculate ranks for a program
export const updateProgramLeaderboard = async (programId: string) => {
    // Aggregate scores by registration
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

    // Update Registration Ranks and Status
    for (let i = 0; i < results.length; i++) {
        await Registration.findByIdAndUpdate(results[i]._id, {
            pointsObtained: results[i].avgScore,
            rank: i + 1,
            status: 'completed'
        });
    }
};

export const getLeaderboard = async () => {
    // Aggregate overall college points based on top 3 ranks
    // Logic: Rank 1 = 10pts, Rank 2 = 5pts, Rank 3 = 3pts (Configurable)

    // This is a simplified fetch. Real aggregation would be complex.
    // We will return list of colleges sorted by their total accumulated points from students.
    return await College.find().sort({ points: -1 }); // Assuming College has points field, or we aggregate on fly
};
