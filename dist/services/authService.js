"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const env_1 = require("../utils/env");
// Generate JWT Token
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, env_1.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};
const registerUser = async (userData) => {
    const { email, password } = userData;
    const userExists = await User_1.default.findOne({ email });
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
    const user = await User_1.default.create(userData);
    if (user) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        };
    }
    else {
        throw new Error('Invalid user data');
    }
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await User_1.default.findOne({ email, isDeleted: false }).select('+password');
    if (user && (await user.matchPassword(password))) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        };
    }
    else {
        throw new Error('Invalid email or password');
    }
};
exports.loginUser = loginUser;
