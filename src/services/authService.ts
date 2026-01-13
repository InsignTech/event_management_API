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
    const { email, password } = userData;
    const userExists = await User.findOne({ email });

    if (userExists) {
        if (userExists.isDeleted) {
            // Re-enable soft deleted user
            userExists.isDeleted = false;
            userExists.name = userData.name || userExists.name;
            userExists.role = userData.role || userExists.role;
            userExists.phone = userData.phone || userExists.phone;
            if (password) {
                userExists.password = password; // pre-save hook will hash it
            }
            await userExists.save();

            return {
                _id: userExists._id,
                name: userExists.name,
                email: userExists.email,
                role: userExists.role,
                token: generateToken(userExists._id.toString(), userExists.role),
            };
        }
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
    const user = await User.findOne({ email, isDeleted: false }).select('+password');

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
