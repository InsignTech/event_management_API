import Student, { IStudent } from '../models/Student';

export const createStudentProfile = async (data: Partial<IStudent>) => {
    const existingProfile = await Student.findOne({ universityRegNo: data.universityRegNo });
    if (existingProfile) {
        throw new Error('Student profile already exists with this University Register Number');
    }
    return await Student.create(data);
};

export const getStudentById = async (id: string) => {
    return await Student.findById(id).populate('college');
};

export const getAllStudents = async (filter: any = {}) => {
    return await Student.find(filter).populate('college');
};

export const updateStudentProfile = async (id: string, data: Partial<IStudent>) => {
    const student = await Student.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
    if (!student) {
        throw new Error('Student profile not found');
    }
    return student;
};

export const deleteStudentProfile = async (id: string) => {
    return await Student.findByIdAndDelete(id);
};

