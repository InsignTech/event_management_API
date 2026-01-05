import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';
import { env } from '../utils/env';

// Generate JWT Token
const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const registerUser = async (userData: Partial<IUser>) => {
    const { email } = userData;
    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new Error('User already exists');
    }

    const user = await User.create(userData);

    if (user) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        };
    } else {
        throw new Error('Invalid user data');
    }
};

export const loginUser = async (email: string, password: string) => {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        };
    } else {
        throw new Error('Invalid email or password');
    }
};
