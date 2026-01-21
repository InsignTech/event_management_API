"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramResults = exports.getPublicPrograms = exports.getPublicLeaderboard = exports.getPublicSchedule = void 0;
const Registration_1 = __importDefault(require("../models/Registration"));
const College_1 = __importDefault(require("../models/College"));
const Program_1 = __importDefault(require("../models/Program"));
const getPublicSchedule = async () => {
    return await Program_1.default.find()
        .populate('event', 'name')
        .sort({ startTime: 1 });
};
exports.getPublicSchedule = getPublicSchedule;
const getPublicLeaderboard = async () => {
    // 1. Fetch all colleges to ensure everyone is listed
    const allColleges = await College_1.default.find({}).select('name logo');
    // 2. Initialize point mapping with all colleges
    const collegePoints = {};
    allColleges.forEach(college => {
        collegePoints[college._id.toString()] = {
            name: college.name,
            logo: college.logo,
            points: 0
        };
    });
    // 3. Fetch completed registrations with rank 1, 2, or 3 for PUBLISHED programs only
    const publishedPrograms = await Program_1.default.find({ isResultPublished: true }).select('_id');
    const publishedProgramIds = publishedPrograms.map(p => p._id);
    const registrations = await Registration_1.default.find({
        program: { $in: publishedProgramIds },
        rank: { $in: [1, 2, 3] },
        status: 'completed'
    }).populate({
        path: 'participants',
        select: 'college',
        populate: { path: 'college', select: 'name logo' }
    });
    // 4. Calculate points for each college
    registrations.forEach(reg => {
        const student = reg.participants[0];
        if (!student || !student.college)
            return;
        const collegeId = student.college._id.toString();
        // Safety check if college exists in our initial list
        if (collegePoints[collegeId]) {
            if (reg.rank === 1)
                collegePoints[collegeId].points += 5;
            else if (reg.rank === 2)
                collegePoints[collegeId].points += 3;
            else if (reg.rank === 3)
                collegePoints[collegeId].points += 1;
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
exports.getPublicLeaderboard = getPublicLeaderboard;
const getPublicPrograms = async () => {
    return await Program_1.default.find({ isResultPublished: true })
        .sort({ name: 1 })
        .select('name type category event')
        .populate('event', 'name');
};
exports.getPublicPrograms = getPublicPrograms;
const getProgramResults = async (programId) => {
    const program = await Program_1.default.findById(programId);
    if (!program || !program.isResultPublished)
        return [];
    return await Registration_1.default.find({
        program: programId,
        rank: { $in: [1, 2, 3] },
        status: 'completed'
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
exports.getProgramResults = getProgramResults;
