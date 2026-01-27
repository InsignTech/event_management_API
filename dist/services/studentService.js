"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudentProfile = exports.updateStudentProfile = exports.getAllStudents = exports.getStudentById = exports.createStudentProfile = exports.generateRegistrationCode = void 0;
const Student_1 = __importDefault(require("../models/Student"));
const generateRegistrationCode = async () => {
    const prefix = 'MF2026-EKM-';
    const lastStudent = await Student_1.default.findOne({ registrationCode: { $regex: new RegExp(`^${prefix}`) } })
        .sort({ registrationCode: -1 }) // This sorts lexicographically, which might be an issue for 9->10 
        .exec();
    // To handle numeric sorting correctly in MongoDB with hyphenated strings, 
    // we might need to fetch all and sort in memory if the list is small, 
    // or use a more sophisticated aggregation. 
    // However, for this pattern, a simple regex sort should work for 
    // standard increments if we assume codes are added sequentially.
    let nextNumber = 1;
    if (lastStudent && lastStudent.registrationCode) {
        const parts = lastStudent.registrationCode.split('-');
        const lastNumber = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }
    // Uniqueness check loop
    let finalCode = `${prefix}${nextNumber}`;
    let isUnique = false;
    while (!isUnique) {
        const exists = await Student_1.default.findOne({ registrationCode: finalCode });
        if (!exists) {
            isUnique = true;
        }
        else {
            nextNumber++;
            finalCode = `${prefix}${nextNumber}`;
        }
    }
    return finalCode;
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
