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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudent = exports.getStudent = exports.deleteStudent = exports.getStudents = exports.createStudent = void 0;
const studentService = __importStar(require("../services/studentService"));
const zod_1 = require("zod");
const createStudentSchema = zod_1.z.object({
    name: zod_1.z.string(),
    college: zod_1.z.string(),
    // universityRegNo: z.string(), // Removed
    phone: zod_1.z.string().max(10, "Phone number cannot exceed 10 digits"),
    course: zod_1.z.string().optional(),
    year: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']),
    emergencyContact: zod_1.z.string().optional()
});
const updateStudentSchema = createStudentSchema.partial();
const createStudent = async (req, res) => {
    try {
        const data = createStudentSchema.parse(req.body);
        const student = await studentService.createStudentProfile({
            ...data,
            createduserId: req.user._id,
        });
        res.status(201).json({ success: true, data: student });
    }
    catch (error) {
        console.log(error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.createStudent = createStudent;
const getStudents = async (req, res) => {
    try {
        const { college, search, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (college)
            filter.college = college;
        if (search) {
            filter.$or = [
                { registrationCode: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const { students, totalCount } = await studentService.getAllStudents(filter, {
            skip,
            limit: Number(limit)
        });
        res.json({
            success: true,
            data: students,
            pagination: {
                total: totalCount,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(totalCount / Number(limit))
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudents = getStudents;
const deleteStudent = async (req, res) => {
    try {
        await studentService.deleteStudentProfile(req.params.id);
        res.json({ success: true, message: 'Student deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteStudent = deleteStudent;
const getStudent = async (req, res) => {
    try {
        const student = await studentService.getStudentById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: student });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudent = getStudent;
const updateStudent = async (req, res) => {
    try {
        const data = updateStudentSchema.parse(req.body);
        const student = await studentService.updateStudentProfile(req.params.id, data);
        res.json({ success: true, data: student });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.updateStudent = updateStudent;
