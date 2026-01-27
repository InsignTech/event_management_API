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
exports.getProgramResults = exports.getPublicPrograms = exports.getPublicLeaderboard = exports.getPublicStats = exports.getPublicSchedule = void 0;
const Registration_1 = __importStar(require("../models/Registration"));
const College_1 = __importDefault(require("../models/College"));
const Program_1 = __importDefault(require("../models/Program"));
const mongoose_1 = __importDefault(require("mongoose"));
const scoreService_1 = require("./scoreService");
const Student_1 = __importDefault(require("../models/Student"));
const getPublicSchedule = async () => {
    // 1. Get all active events
    const activeEvents = await mongoose_1.default.model('Event').find({ isActive: true }).select('_id');
    const activeEventIds = activeEvents.map(e => e._id);
    // 2. Return programs for active events that are not cancelled
    return await Program_1.default.find({
        event: { $in: activeEventIds },
        isCancelled: { $ne: true }
    })
        .populate('event', 'name')
        .sort({ startTime: 1 });
};
exports.getPublicSchedule = getPublicSchedule;
const getPublicStats = async () => {
    const [totalColleges, totalPrograms, totalStudents, totalRegistrations] = await Promise.all([
        College_1.default.countDocuments(),
        Program_1.default.countDocuments({ isCancelled: { $ne: true } }),
        Student_1.default.countDocuments(),
        Registration_1.default.countDocuments({ status: { $ne: 'cancelled' } })
    ]);
    return {
        totalColleges,
        totalPrograms,
        totalStudents,
        totalRegistrations
    };
};
exports.getPublicStats = getPublicStats;
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
    // 3. Fetch completed registrations for PUBLISHED programs only
    const publishedPrograms = await Program_1.default.find({ isResultPublished: true }).select('_id type');
    const publishedProgramIds = publishedPrograms.map(p => p._id);
    const programTypeMap = {};
    publishedPrograms.forEach(prog => {
        programTypeMap[prog._id.toString()] = prog.type;
    });
    const registrations = await Registration_1.default.find({
        program: { $in: publishedProgramIds },
        status: Registration_1.RegistrationStatus.COMPLETED
    }).populate({
        path: 'participants',
        select: 'college',
        populate: { path: 'college', select: 'name logo' }
    });
    // 4. Calculate dynamic ranks for each program and aggregate points
    const registrationsByProgram = {};
    registrations.forEach(reg => {
        const progId = reg.program.toString();
        if (!registrationsByProgram[progId])
            registrationsByProgram[progId] = [];
        registrationsByProgram[progId].push(reg.toObject());
    });
    Object.entries(registrationsByProgram).forEach(([progId, progRegs]) => {
        const programType = programTypeMap[progId];
        const isGroup = programType === 'GROUP' || programType === 'Group' || programType === 'group';
        const rankedRegs = (0, scoreService_1.calculateRanks)(progRegs);
        rankedRegs.forEach(reg => {
            if (reg.rank > 3)
                return; // Only top 3 get points
            const student = reg.participants[0];
            if (!student || !student.college)
                return;
            const collegeId = student.college._id.toString();
            // Safety check if college exists in our initial list
            if (collegePoints[collegeId]) {
                if (isGroup) {
                    if (reg.rank === 1)
                        collegePoints[collegeId].points += 30;
                    else if (reg.rank === 2)
                        collegePoints[collegeId].points += 20;
                    else if (reg.rank === 3)
                        collegePoints[collegeId].points += 10;
                }
                else {
                    if (reg.rank === 1)
                        collegePoints[collegeId].points += 15;
                    else if (reg.rank === 2)
                        collegePoints[collegeId].points += 10;
                    else if (reg.rank === 3)
                        collegePoints[collegeId].points += 5;
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
    const registrations = await Registration_1.default.find({
        program: programId,
        status: Registration_1.RegistrationStatus.COMPLETED
    }).populate({
        path: 'participants',
        select: 'name college registrationCode',
        populate: {
            path: 'college',
            select: 'name logo'
        }
    });
    const ranked = (0, scoreService_1.calculateRanks)(registrations.map(r => r.toObject()));
    // Return top 3
    return ranked.filter(r => r.rank <= 3).sort((a, b) => a.rank - b.rank);
};
exports.getProgramResults = getProgramResults;
