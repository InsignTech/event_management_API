import User from '../models/User';

export const searchUsers = async (query: string) => {
    if (!query) return [];

    return await User.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    })
        .select('name email role')
        .limit(10);
};
