import { Request, Response } from 'express';
import Registration, { RegistrationStatus } from '../models/Registration';
import Program, { ProgramType } from '../models/Program';
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
                    participants: reg.participants.map((p: any) => `${p.name}`).join(', '),
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
                participants: reg.participants.map((p: any) => `${p.name}`).join(', '),
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

export const exportStudentRanking = async (req: Request, res: Response) => {
    try {
        const { gender } = req.query;

        // 1. Get all published programs of type SINGLE (Individual)
        const programs = await Program.find({
            type: ProgramType.SINGLE,
            isResultPublished: true
        });
        const programIds = programs.map(p => p._id);

        if (!programIds.length) {
            return res.status(404).json({ success: false, message: 'No published results found for individual programs' });
        }

        // 2. Get all completed registrations for these programs
        const registrations = await Registration.find({
            program: { $in: programIds },
            status: RegistrationStatus.COMPLETED
        }).populate({
            path: 'participants',
            match: gender && gender !== 'all' ? { gender: gender.toString().toLowerCase() } : {},
            populate: { path: 'college' }
        });

        // 3. Group by program to calculate ranks
        const registrationsByProgram: Record<string, any[]> = {};
        registrations.forEach(reg => {
            const progId = reg.program.toString();
            if (!registrationsByProgram[progId]) registrationsByProgram[progId] = [];
            registrationsByProgram[progId].push(reg.toObject());
        });

        const studentScores = new Map<string, { student: any, points: number, breakdown: any[] }>();

        Object.entries(registrationsByProgram).forEach(([progId, regs]) => {
            const ranked = calculateRanks(regs);
            ranked.forEach(reg => {
                if (reg.rank > 3) return; // Only top 3 ranks count for student individual points

                // Standard Point System for Individual Items: 1st=5, 2nd=3, 3rd=1
                const points = reg.rank === 1 ? 5 : reg.rank === 2 ? 3 : 1;

                // SINGLE programs always have exactly 1 participant in the array
                // If Match fails (gender), student will be null
                const student = reg.participants[0];

                if (!student) return;

                const studentId = student._id.toString();
                if (!studentScores.has(studentId)) {
                    studentScores.set(studentId, { student, points: 0, breakdown: [] });
                }

                const entry = studentScores.get(studentId)!;
                entry.points += points;
                entry.breakdown.push({
                    programName: programs.find(p => p._id.toString() === progId)?.name,
                    rank: reg.rank,
                    points
                });
            });
        });

        const sortedStudents = Array.from(studentScores.values()).sort((a, b) => b.points - a.points);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Individual Student Ranking');

        sheet.columns = [
            { header: 'Rank', key: 'rank', width: 10 },
            { header: 'Student Name', key: 'name', width: 30 },
            { header: 'Gender', key: 'gender', width: 15 },
            { header: 'College', key: 'college', width: 35 },
            { header: 'Total Points', key: 'points', width: 15 },
            { header: 'Breakdown (Program: Rank)', key: 'breakdown', width: 60 },
        ];

        let currentRank = 1;
        sortedStudents.forEach((entry, index) => {
            if (index > 0 && entry.points < sortedStudents[index - 1].points) {
                currentRank += 1;
            }
            sheet.addRow({
                rank: currentRank,
                name: entry.student.name,
                gender: entry.student.gender?.toUpperCase() || 'N/A',
                college: entry.student.college?.name || 'N/A',
                points: entry.points,
                breakdown: entry.breakdown.map(b => `${b.programName} (Rank: ${b.rank})`).join(', ')
            });
        });

        // Global Styles
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        const fileName = `individual_student_ranking_${gender || 'all'}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        console.error('Error exporting student ranking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportCollegeLeaderboard = async (req: Request, res: Response) => {
    try {
        // 1. Fetch all colleges to ensure everyone is listed
        const allColleges = await College.find({}).select('name');

        // 2. Initialize point mapping with all colleges
        const collegePoints: Record<string, { name: string, points: number, breakdown: string[] }> = {};

        allColleges.forEach(college => {
            collegePoints[college._id.toString()] = {
                name: college.name,
                points: 0,
                breakdown: []
            };
        });

        // 3. Fetch completed registrations for PUBLISHED programs only
        const publishedPrograms = await Program.find({ isResultPublished: true }).select('_id type name');
        const publishedProgramIds = publishedPrograms.map(p => p._id);
        const programTypeMap: Record<string, { type: string, name: string }> = {};
        publishedPrograms.forEach(prog => {
            programTypeMap[prog._id.toString()] = { type: prog.type, name: prog.name };
        });

        const registrations = await Registration.find({
            program: { $in: publishedProgramIds },
            status: RegistrationStatus.COMPLETED
        }).populate({
            path: 'participants',
            select: 'college',
            populate: { path: 'college', select: 'name' }
        });

        // 4. Calculate dynamic ranks for each program and aggregate points
        const registrationsByProgram: Record<string, any[]> = {};
        registrations.forEach(reg => {
            const progId = reg.program.toString();
            if (!registrationsByProgram[progId]) registrationsByProgram[progId] = [];
            registrationsByProgram[progId].push(reg.toObject());
        });

        Object.entries(registrationsByProgram).forEach(([progId, progRegs]) => {
            const programInfo = programTypeMap[progId];
            const isGroup = programInfo?.type === 'GROUP' || programInfo?.type === 'Group' || programInfo?.type === 'group';

            const rankedRegs = calculateRanks(progRegs);
            rankedRegs.forEach(reg => {
                if (reg.rank > 3) return; // Only top 3 get points

                const student = (reg.participants as any)[0];
                if (!student || !student.college) return;

                const collegeId = student.college._id.toString();

                // Safety check if college exists in our initial list
                if (collegePoints[collegeId]) {
                    let ptsObtained = 0;
                    if (isGroup) {
                        if (reg.rank === 1) ptsObtained = 10;
                        else if (reg.rank === 2) ptsObtained = 6;
                        else if (reg.rank === 3) ptsObtained = 2;
                    } else {
                        if (reg.rank === 1) ptsObtained = 5;
                        else if (reg.rank === 2) ptsObtained = 3;
                        else if (reg.rank === 3) ptsObtained = 1;
                    }

                    if (ptsObtained > 0) {
                        collegePoints[collegeId].points += ptsObtained;
                        collegePoints[collegeId].breakdown.push(`${programInfo.name}: Rank ${reg.rank}`);
                    }
                }
            });
        });

        // 5. Convert to array and sort
        const sortedStandings = Object.values(collegePoints).sort((a, b) => b.points - a.points);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('College Leaderboard');

        sheet.columns = [
            { header: 'Rank', key: 'rank', width: 10 },
            { header: 'College Name', key: 'name', width: 40 },
            { header: 'Total Points', key: 'points', width: 20 },
            { header: 'Remarks', key: 'remarks', width: 100 }
        ];

        let currentRank = 1;
        sortedStandings.forEach((standing, index) => {
            if (index > 0 && standing.points < sortedStandings[index - 1].points) {
                currentRank += 1;
            }
            sheet.addRow({
                rank: currentRank,
                name: standing.name,
                points: standing.points,
                remarks: standing.breakdown.join(', ')
            });
        });

        sheet.getRow(1).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=college_leaderboard.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        console.error('Error exporting college leaderboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


