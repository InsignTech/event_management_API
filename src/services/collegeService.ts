import College, { ICollege } from '../models/College';

export const createCollege = async (data: Partial<ICollege>) => {
    const existingCollege = await College.findOne({ name: data.name });
    if (existingCollege) {
        throw new Error('College with this name already exists');
    }
    return await College.create(data);
};

export const getColleges = async () => {
    return await College.find({});
};

export const getCollegeById = async (id: string) => {
    const college = await College.findById(id);
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};

export const updateCollege = async (id: string, data: Partial<ICollege>) => {
    const college = await College.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};

export const deleteCollege = async (id: string) => {
    const college = await College.findByIdAndDelete(id);
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};
