"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudentProfile = exports.updateStudentProfile = exports.getAllStudents = exports.getStudentById = exports.createStudentProfile = exports.generateRegistrationCode = void 0;
const Student_1 = __importDefault(require("../models/Student"));
const generateRegistrationCode = async () => {
    const lastStudent = await Student_1.default.findOne({ registrationCode: { $regex: /^MESYF/ } })
        .sort({ registrationCode: -1 })
        .exec();
    if (!lastStudent || !lastStudent.registrationCode) {
        return 'MESYF0001';
    }
    const lastCode = lastStudent.registrationCode;
    const numberPart = parseInt(lastCode.replace('MESYF', ''), 10);
    const nextNumber = numberPart + 1;
    return `MESYF${nextNumber.toString().padStart(4, '0')}`;
};
exports.generateRegistrationCode = generateRegistrationCode;
const createStudentProfile = async (data) => {
    const existingProfile = await Student_1.default.findOne({
        name: data.name,
        college: data.college,
        phone: data.phone
    });
    if (existingProfile) {
        throw new Error('Student profile already exists with this Name, College, and Phone Number');
    }
    const registrationCode = await (0, exports.generateRegistrationCode)();
    return await Student_1.default.create({
        ...data,
        registrationCode
    });
};
exports.createStudentProfile = createStudentProfile;
const getStudentById = async (id) => {
    return await Student_1.default.findById(id).populate('college');
};
exports.getStudentById = getStudentById;
const getAllStudents = async (filter = {}, options = {}) => {
    const students = await Student_1.default.find(filter)
        .populate('college')
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 0);
    const totalCount = await Student_1.default.countDocuments(filter);
    return { students, totalCount };
};
exports.getAllStudents = getAllStudents;
const updateStudentProfile = async (id, data) => {
    const student = await Student_1.default.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
    if (!student) {
        throw new Error('Student profile not found');
    }
    return student;
};
exports.updateStudentProfile = updateStudentProfile;
const deleteStudentProfile = async (id) => {
    return await Student_1.default.findByIdAndDelete(id);
};
exports.deleteStudentProfile = deleteStudentProfile;
