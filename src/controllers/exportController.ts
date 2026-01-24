import { Request, Response } from 'express';
import Registration from '../models/Registration';
import Program from '../models/Program';
import College from '../models/College';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { calculateRanks } from '../services/scoreService';

export const exportCollegeWise = async (req: Request, res: Response) => {
    try {
        const registrations = await Registration.find()
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

        const registrations = await Registration.find({ program: programId })
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
            { header: 'Rank', key: 'rank', width: 10 },
            { header: 'Points', key: 'points', width: 10 },
        ];

        sheet.addRow({ chestNumber: `Program: ${program.name}` });
        sheet.addRow({});

        ranked.forEach((reg: any) => {
            sheet.addRow({
                chestNumber: reg.chestNumber || 'PENDING',
                participants: reg.participants.map((p: any) => `${p.name} (${p.registrationCode})`).join(', '),
                college: reg.participants[0]?.college?.name || 'N/A',
                status: reg.status.toUpperCase(),
                rank: reg.rank || '-',
                points: reg.pointsObtained || 0,
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
