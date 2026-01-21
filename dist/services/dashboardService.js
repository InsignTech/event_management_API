"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventStatus = exports.getRecentRegistrations = exports.getStats = void 0;
const College_1 = __importDefault(require("../models/College"));
const Student_1 = __importDefault(require("../models/Student"));
const Registration_1 = __importDefault(require("../models/Registration"));
const Program_1 = __importDefault(require("../models/Program"));
const Event_1 = __importDefault(require("../models/Event"));
const getStats = async () => {
    const [totalColleges, totalPrograms, totalStudents, totalRegistrations] = await Promise.all([
        College_1.default.countDocuments(),
        Program_1.default.countDocuments(),
        Student_1.default.countDocuments(),
        Registration_1.default.countDocuments()
    ]);
    return {
        totalColleges,
        totalPrograms,
        totalStudents,
        totalRegistrations
    };
};
exports.getStats = getStats;
const getRecentRegistrations = async (limit = 5) => {
    return await Registration_1.default.find()
        .sort({ registeredAt: -1 })
        .limit(limit)
        .populate('program')
        .populate('participants', 'name registrationCode');
};
exports.getRecentRegistrations = getRecentRegistrations;
const getEventStatus = async () => {
    const [upcoming, ongoing, completed] = await Promise.all([
        Event_1.default.countDocuments({ status: 'upcoming' }),
        Event_1.default.countDocuments({ status: 'ongoing' }),
        Event_1.default.countDocuments({ status: 'completed' })
    ]);
    const activeEvents = await Event_1.default.find({ status: 'ongoing' })
        .select('name venue startDate endDate')
        .limit(5);
    return {
        counts: { upcoming, ongoing, completed },
        activeEvents
    };
};
exports.getEventStatus = getEventStatus;
