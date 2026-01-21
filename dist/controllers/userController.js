"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = exports.remove = exports.update = exports.create = exports.getAll = void 0;
const userService = __importStar(require("../services/userService"));
const authService = __importStar(require("../services/authService"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.nativeEnum(User_1.UserRole).optional(),
    phone: zod_1.z.string().optional(),
});
const updateUserSchema = createUserSchema.partial();
const getAll = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAll = getAll;
const create = async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);
        const user = await authService.registerUser(data);
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const data = updateUserSchema.parse(req.body);
        const user = await userService.updateUser(req.params.id, data);
        res.json({ success: true, data: user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await userService.softDeleteUser(req.params.id);
        res.json({ success: true, message: 'User removed (soft-deleted)' });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.remove = remove;
const search = async (req, res) => {
    try {
        const query = req.query.q;
        const users = await userService.searchUsers(query);
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.search = search;
