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
exports.remove = exports.update = exports.getById = exports.getAll = exports.create = void 0;
const collegeService = __importStar(require("../services/collegeService"));
const zod_1 = require("zod");
const College_1 = require("../models/College");
// Validation Schemas
const createCollegeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    address: zod_1.z.string().min(5),
    coordinatorName: zod_1.z.string().min(2),
    coordinatorEmail: zod_1.z.string().email(),
    coordinatorPhone: zod_1.z.string().min(10),
    logo: zod_1.z.string().url().optional(),
    status: zod_1.z.nativeEnum(College_1.CollegeStatus).optional(),
});
const updateCollegeSchema = createCollegeSchema.partial();
const create = async (req, res) => {
    try {
        const data = createCollegeSchema.parse(req.body);
        const college = await collegeService.createCollege({
            ...data,
            createduserId: req.user._id
        });
        res.status(201).json({ success: true, data: college });
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
const getAll = async (req, res) => {
    try {
        const colleges = await collegeService.getColleges();
        res.json({ success: true, data: colleges });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const college = await collegeService.getCollegeById(req.params.id);
        res.json({ success: true, data: college });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.getById = getById;
const update = async (req, res) => {
    try {
        // Check if user is authorized later (context-aware), for now only Admin access in routes handles it
        const data = updateCollegeSchema.parse(req.body);
        const college = await collegeService.updateCollege(req.params.id, data);
        res.json({ success: true, data: college });
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
        await collegeService.deleteCollege(req.params.id);
        res.json({ success: true, message: 'College removed' });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.remove = remove;
