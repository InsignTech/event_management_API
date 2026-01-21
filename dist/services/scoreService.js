"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.updateProgramLeaderboard = exports.submitScore = exports.publishResults = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Score_1 = __importDefault(require("../models/Score"));
const Registration_1 = __importDefault(require("../models/Registration"));
const College_1 = __importDefault(require("../models/College"));
const Program_1 = __importDefault(require("../models/Program"));
// ... (imports)
// Publish results for a program
const publishResults = async (programId) => {
    const program = await Program_1.default.findById(programId);
    if (!program)
        throw new Error('Program not found');
    program.isResultPublished = true;
    await program.save();
    // Ensure all ranks are calculated and finalized
    await (0, exports.updateProgramLeaderboard)(programId);
};
exports.publishResults = publishResults;
const submitScore = async (input) => {
    // Check if program results are published
    const program = await Program_1.default.findById(input.programId);
    if (!program)
        throw new Error('Program not found');
    console.log('SubmitScore Program Check:', { programId: input.programId, isPublished: program.isResultPublished });
    if (program.isResultPublished) {
        throw new Error('Cannot edit scores after results are published');
    }
    const totalPoints = Object.values(input.criteria).reduce((a, b) => a + b, 0);
    const score = await Score_1.default.findOneAndUpdate({
        program: input.programId,
        registration: input.registrationId,
        judgeId: input.judgeId,
    }, {
        criteria: input.criteria,
        totalPoints,
    }, { new: true, upsert: true });
    // TODO: Trigger Leaderboard Recalculation (Async)
    await (0, exports.updateProgramLeaderboard)(input.programId);
    return score;
};
exports.submitScore = submitScore;
// Recalculate ranks for a program
const updateProgramLeaderboard = async (programId) => {
    // Aggregate scores by registration
    const results = await Score_1.default.aggregate([
        { $match: { program: new mongoose_1.default.Types.ObjectId(programId) } },
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
        await Registration_1.default.findByIdAndUpdate(results[i]._id, {
            pointsObtained: results[i].avgScore,
            rank: i + 1,
            status: 'completed'
        });
    }
};
exports.updateProgramLeaderboard = updateProgramLeaderboard;
const getLeaderboard = async () => {
    // Aggregate overall college points based on top 3 ranks ONLY for published programs
    // Logic: Rank 1 = 10pts, Rank 2 = 5pts, Rank 3 = 3pts (Configurable)
    // This is a simplified fetch. Real aggregation would be complex.
    // We will return list of colleges sorted by their total accumulated points from students.
    return await College_1.default.find().sort({ points: -1 }); // Assuming College has points field, or we aggregate on fly
};
exports.getLeaderboard = getLeaderboard;
