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
exports.exportCollegeWiseParticipantNonDistinctCount = exports.exportCollegeWiseParticipantDistinctCount = exports.exportProgramWise = exports.exportCollegeWise = void 0;
const Registration_1 = __importStar(require("../models/Registration"));
const Program_1 = __importDefault(require("../models/Program"));
const College_1 = __importDefault(require("../models/College"));
const exceljs_1 = __importDefault(require("exceljs"));
const scoreService_1 = require("../services/scoreService");
const exportCollegeWise = async (req, res) => {
    try {
        const registrations = await Registration_1.default.find()
            .populate({
            path: 'participants',
            populate: { path: 'college' }
        })
            .populate('program');
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet('College-wise Registrations');
        sheet.columns = [
            { header: 'College', key: 'college', width: 30 },
            { header: 'Program', key: 'program', width: 30 },
            { header: 'Chest Number', key: 'chestNumber', width: 15 },
            { header: 'Participants', key: 'participants', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
        ];
        // Group by college name
        const grouped = registrations.reduce((acc, reg) => {
            const collegeName = reg.participants[0]?.college?.name || 'Unknown';
            if (!acc[collegeName])
                acc[collegeName] = [];
            acc[collegeName].push(reg);
            return acc;
        }, {});
        Object.keys(grouped).sort().forEach(collegeName => {
            grouped[collegeName].forEach((reg) => {
                sheet.addRow({
                    college: collegeName,
                    program: reg.program?.name || 'N/A',
                    chestNumber: reg.chestNumber || 'PENDING',
                    participants: reg.participants.map((p) => `${p.name} (${p.registrationCode})`).join(', '),
                    status: reg.status.toUpperCase(),
                });
            });
            sheet.addRow({}); // Empty row between colleges
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=college_wise_registrations.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.exportCollegeWise = exportCollegeWise;
const exportProgramWise = async (req, res) => {
    try {
        const { programId } = req.params;
        const program = await Program_1.default.findById(programId);
        if (!program)
            return res.status(404).json({ success: false, message: 'Program not found' });
        const registrations = await Registration_1.default.find({ program: programId })
            .populate({
            path: 'participants',
            populate: { path: 'college' }
        });
        const ranked = (0, scoreService_1.calculateRanks)(registrations.map(r => r.toObject()));
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet('Program-wise Registrations');
        sheet.columns = [
            { header: 'Chest Number', key: 'chestNumber', width: 15 },
            { header: 'Participants', key: 'participants', width: 50 },
            { header: 'College', key: 'college', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
        ];
        sheet.addRow({ chestNumber: `Program: ${program.name}` });
        sheet.addRow({});
        ranked.forEach((reg) => {
            sheet.addRow({
                chestNumber: reg.chestNumber || 'PENDING',
                participants: reg.participants.map((p) => `${p.name} (${p.registrationCode})`).join(', '),
                college: reg.participants[0]?.college?.name || 'N/A',
                status: reg.status.toUpperCase(),
            });
        });
        const fileName = `${program.name.replace(/\s+/g, '_')}_registrations.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.exportProgramWise = exportProgramWise;
const exportCollegeWiseParticipantDistinctCount = async (req, res) => {
    try {
        const colleges = await College_1.default.find().sort({ name: 1 });
        const registrations = await Registration_1.default.find({
            status: { $nin: [Registration_1.RegistrationStatus.CANCELLED, Registration_1.RegistrationStatus.REJECTED] }
        }).populate('participants');
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet('Distinct Participants');
        sheet.columns = [
            { header: 'College', key: 'college', width: 40 },
            { header: 'Male (Distinct)', key: 'male', width: 20 },
            { header: 'Female (Distinct)', key: 'female', width: 20 },
            { header: 'Other (Distinct)', key: 'other', width: 20 },
            { header: 'Total (Distinct)', key: 'total', width: 20 },
        ];
        colleges.forEach(college => {
            const collegeId = college._id.toString();
            const uniqueStudents = new Map();
            registrations.forEach(reg => {
                reg.participants.forEach((student) => {
                    if (student.college.toString() === collegeId) {
                        uniqueStudents.set(student._id.toString(), student);
                    }
                });
            });
            let male = 0;
            let female = 0;
            let other = 0;
            uniqueStudents.forEach(student => {
                if (student.gender === 'male')
                    male++;
                else if (student.gender === 'female')
                    female++;
                else
                    other++;
            });
            sheet.addRow({
                college: college.name,
                male,
                female,
                other,
                total: uniqueStudents.size
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=college_wise_distinct_participants.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.exportCollegeWiseParticipantDistinctCount = exportCollegeWiseParticipantDistinctCount;
const exportCollegeWiseParticipantNonDistinctCount = async (req, res) => {
    try {
        const colleges = await College_1.default.find().sort({ name: 1 });
        const registrations = await Registration_1.default.find({
            status: { $nin: [Registration_1.RegistrationStatus.CANCELLED, Registration_1.RegistrationStatus.REJECTED] }
        }).populate('participants');
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet('Total Entries');
        sheet.columns = [
            { header: 'College', key: 'college', width: 40 },
            { header: 'Male Entries', key: 'male', width: 20 },
            { header: 'Female Entries', key: 'female', width: 20 },
            { header: 'Other Entries', key: 'other', width: 20 },
            { header: 'Total Entries', key: 'total', width: 20 },
        ];
        colleges.forEach(college => {
            const collegeId = college._id.toString();
            let male = 0;
            let female = 0;
            let other = 0;
            registrations.forEach(reg => {
                reg.participants.forEach((student) => {
                    if (student.college.toString() === collegeId) {
                        if (student.gender === 'male')
                            male++;
                        else if (student.gender === 'female')
                            female++;
                        else
                            other++;
                    }
                });
            });
            sheet.addRow({
                college: college.name,
                male,
                female,
                other,
                total: male + female + other
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=college_wise_total_entries.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.exportCollegeWiseParticipantNonDistinctCount = exportCollegeWiseParticipantNonDistinctCount;
