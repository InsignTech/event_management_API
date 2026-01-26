import Student, { IStudent } from '../models/Student';

export const generateRegistrationCode = async (): Promise<string> => {
    const prefix = 'MF2026-EKM-';
    const lastStudent = await Student.findOne({ registrationCode: { $regex: new RegExp(`^${prefix}`) } })
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
        const exists = await Student.findOne({ registrationCode: finalCode });
        if (!exists) {
            isUnique = true;
        } else {
            nextNumber++;
            finalCode = `${prefix}${nextNumber}`;
        }
    }

    return finalCode;
};

export const createStudentProfile = async (data: Partial<IStudent>) => {
    const existingProfile = await Student.findOne({
        name: data.name,
        college: data.college,
        phone: data.phone
    });
    if (existingProfile) {
        throw new Error('Student profile already exists with this Name, College, and Phone Number');
    }

    const registrationCode = await generateRegistrationCode();

    return await Student.create({
        ...data,
        registrationCode
    });
};

export const getStudentById = async (id: string) => {
    return await Student.findById(id).populate('college');
};

export const getAllStudents = async (filter: any = {}, options: { skip?: number, limit?: number, sort?: any } = {}) => {
    const students = await Student.find(filter)
        .populate('college')
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 0);

    const totalCount = await Student.countDocuments(filter);

    return { students, totalCount };
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

