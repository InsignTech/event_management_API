"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.updateProgramLeaderboard = exports.submitScore = exports.publishResults = exports.calculateRanks = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Score_1 = __importDefault(require("../models/Score"));
const Registration_1 = __importStar(require("../models/Registration"));
const College_1 = __importDefault(require("../models/College"));
const Program_1 = __importDefault(require("../models/Program"));
// Helper to calculate ranks dynamically based on pointsObtained
const calculateRanks = (items) => {
    // 1. Sort by pointsObtained descending
    const sorted = [...items].sort((a, b) => (b.pointsObtained || 0) - (a.pointsObtained || 0));
    // 2. Assign ranks handling ties
    let currentRank = 1;
    return sorted.map((item, index) => {
        const score = Math.round((item.pointsObtained || 0) * 10000) / 10000;
        if (index > 0) {
            const prevScore = Math.round((sorted[index - 1].pointsObtained || 0) * 10000) / 10000;
            if (score < prevScore) {
                currentRank = index + 1;
            }
        }
        return { ...item, rank: currentRank };
    });
};
exports.calculateRanks = calculateRanks;
// Publish results for a program
const publishResults = async (programId, userId) => {
    const program = await Program_1.default.findById(programId);
    if (!program)
        throw new Error('Program not found');
    program.isResultPublished = true;
    program.lastUpdateduserId = userId;
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
    // 1. Aggregate scores by registration
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
    if (results.length === 0)
        return;
    // 2. Sort in memory to ensure absolute consistency
    results.sort((a, b) => b.avgScore - a.avgScore);
    for (let i = 0; i < results.length; i++) {
        await Registration_1.default.findByIdAndUpdate(results[i]._id, {
            pointsObtained: results[i].avgScore,
            status: Registration_1.RegistrationStatus.COMPLETED
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
