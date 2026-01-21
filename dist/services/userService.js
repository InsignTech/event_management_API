"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.softDeleteUser = exports.updateUser = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const getAllUsers = async () => {
    return await User_1.default.find({ isDeleted: false }).select('-password');
};
exports.getAllUsers = getAllUsers;
const updateUser = async (id, data) => {
    const user = await User_1.default.findById(id);
    if (!user)
        throw new Error('User not found');
    // Don't allow changing email to someone else's
    if (data.email && data.email !== user.email) {
        const emailExists = await User_1.default.findOne({ email: data.email, _id: { $ne: id } });
        if (emailExists)
            throw new Error('Email already in use');
    }
    Object.assign(user, data);
    await user.save();
    return user;
};
exports.updateUser = updateUser;
const softDeleteUser = async (id) => {
    const user = await User_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!user)
        throw new Error('User not found');
    return user;
};
exports.softDeleteUser = softDeleteUser;
const searchUsers = async (query) => {
    if (!query)
        return [];
    return await User_1.default.find({
        isDeleted: false,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    })
        .select('name email role')
        .limit(10);
};
exports.searchUsers = searchUsers;
