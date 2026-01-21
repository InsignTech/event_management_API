import Student, { IStudent } from '../models/Student';

export const generateRegistrationCode = async (): Promise<string> => {
    const lastStudent = await Student.findOne({ registrationCode: { $regex: /^MESYF/ } })
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

