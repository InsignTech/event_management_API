import User, { IUser } from '../models/User';

export const getAllUsers = async () => {
    return await User.find({ isDeleted: false }).select('-password');
};

export const updateUser = async (id: string, data: Partial<IUser>) => {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    // Don't allow changing email to someone else's
    if (data.email && data.email !== user.email) {
        const emailExists = await User.findOne({ email: data.email, _id: { $ne: id } });
        if (emailExists) throw new Error('Email already in use');
    }

    Object.assign(user, data);
    await user.save();
    return user;
};

export const softDeleteUser = async (id: string) => {
    const user = await User.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!user) throw new Error('User not found');
    return user;
};

export const searchUsers = async (query: string) => {
    if (!query) return [];

    return await User.find({
        isDeleted: false,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    })
        .select('name email role')
        .limit(10);
};
