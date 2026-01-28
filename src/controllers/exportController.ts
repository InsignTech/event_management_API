import { Request, Response } from 'express';
import Registration, { RegistrationStatus } from '../models/Registration';
import Program from '../models/Program';
import College from '../models/College';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { calculateRanks } from '../services/scoreService';

export const exportCollegeWise = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const registrations = await Registration.find(query)
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            })
            .populate('program');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('College-wise Registrations');

        sheet.columns = [
            { header: 'College', key: 'college', width: 30 },
            { header: 'Program', key: 'program', width: 30 },
            { header: 'Chest Number', key: 'chestNumber', width: 15 },
            { header: 'Participants', key: 'participants', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        // Group by college name
        const grouped = registrations.reduce((acc: any, reg: any) => {
            const collegeName = reg.participants[0]?.college?.name || 'Unknown';
            if (!acc[collegeName]) acc[collegeName] = [];
            acc[collegeName].push(reg);
            return acc;
        }, {});

        Object.keys(grouped).sort().forEach(collegeName => {
            grouped[collegeName].forEach((reg: any) => {
                sheet.addRow({
                    college: collegeName,
                    program: reg.program?.name || 'N/A',
                    chestNumber: reg.chestNumber || 'PENDING',
                    participants: reg.participants.map((p: any) => `${p.name} (${p.registrationCode})`).join(', '),
                    status: reg.status.toUpperCase(),
                });
            });
            sheet.addRow({}); // Empty row between colleges
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=college_wise_registrations.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportProgramWise = async (req: Request, res: Response) => {
    try {
        const { programId } = req.params;
        const program = await Program.findById(programId);
        if (!program) return res.status(404).json({ success: false, message: 'Program not found' });

        const { status } = req.query;
        const query: any = { program: programId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const registrations = await Registration.find(query)
            .populate({
                path: 'participants',
                populate: { path: 'college' }
            });

        const ranked = calculateRanks(registrations.map(r => r.toObject()));

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Program-wise Registrations');

        sheet.columns = [
            { header: 'Chest Number', key: 'chestNumber', width: 15 },
            { header: 'Participants', key: 'participants', width: 50 },
            { header: 'College', key: 'college', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        sheet.addRow({ chestNumber: `Program: ${program.name}` });
        sheet.addRow({});

        ranked.forEach((reg: any) => {
            sheet.addRow({
                chestNumber: reg.chestNumber || 'PENDING',
                participants: reg.participants.map((p: any) => `${p.name} (${p.registrationCode})`).join(', '),
                college: reg.participants[0]?.college?.name || 'N/A',
                status: reg.status.toUpperCase(),
            });
        });

        const fileName = `${program.name.replace(/\s+/g, '_')}_registrations.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportCollegeWiseParticipantDistinctCount = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        } else {
            // Default: exclude cancelled and rejected if not specified or "all"
            // Actually, if "all" is selected, we might want to include them? 
            // The user said "all default selected", let's follow that.
            // If it's "all", let's exclude cancelled/rejected by default to maintain previous behavior but allow specifically selection.
            query.status = { $nin: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED] };
        }

        const colleges = await College.find().sort({ name: 1 });
        const registrations = await Registration.find(query).populate('participants');

        const workbook = new ExcelJS.Workbook();
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
            const uniqueStudents = new Map<string, any>();

            registrations.forEach(reg => {
                reg.participants.forEach((student: any) => {
                    if (student.college.toString() === collegeId) {
                        uniqueStudents.set(student._id.toString(), student);
                    }
                });
            });

            let male = 0;
            let female = 0;
            let other = 0;

            uniqueStudents.forEach(student => {
                if (student.gender === 'male') male++;
                else if (student.gender === 'female') female++;
                else other++;
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
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportCollegeWiseParticipantNonDistinctCount = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        } else {
            query.status = { $nin: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED] };
        }

        const colleges = await College.find().sort({ name: 1 });
        const registrations = await Registration.find(query).populate('participants');

        const workbook = new ExcelJS.Workbook();
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
                reg.participants.forEach((student: any) => {
                    if (student.college.toString() === collegeId) {
                        if (student.gender === 'male') male++;
                        else if (student.gender === 'female') female++;
                        else other++;
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
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

