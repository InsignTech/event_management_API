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
exports.getCollegePrograms = exports.updateRegistration = exports.report = exports.updateStatus = exports.deleteRegistration = exports.cancelRegistration = exports.getStudentRegistrations = exports.getAll = exports.getRegistrations = exports.register = void 0;
const registrationService = __importStar(require("../services/registrationService"));
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    program: zod_1.z.string(),
    participants: zod_1.z.array(zod_1.z.string()).min(1),
});
const register = async (req, res) => {
    try {
        const { program: programId, participants } = registerSchema.parse(req.body);
        const createdUserId = req.user._id;
        // Fetch program to check type
        const { getProgramById } = await Promise.resolve().then(() => __importStar(require('../services/programService')));
        const program = await getProgramById(programId);
        if (program.type === 'single' && participants.length > 1) {
            return res.status(400).json({ success: false, message: 'Single program can only have one participant' });
        }
        const registration = await registrationService.registerForProgram(participants, programId, createdUserId);
        // Generate QR
        const { generateQRCode } = await Promise.resolve().then(() => __importStar(require('../utils/qrcode')));
        const qrCodeDataUrl = await generateQRCode(registration._id.toString());
        res.status(201).json({ success: true, data: { ...registration.toObject(), qrCode: qrCodeDataUrl } });
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
exports.register = register;
const getRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const status = req.query.status;
        const result = await registrationService.getRegistrationsByProgram(req.params.programId, page, limit, search, status);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRegistrations = getRegistrations;
const getAll = async (req, res) => {
    try {
        const registrations = await registrationService.getAllRegistrations();
        res.json({ success: true, data: registrations });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAll = getAll;
const getStudentRegistrations = async (req, res) => {
    try {
        const registrations = await registrationService.getRegistrationsByStudent(req.params.studentId);
        res.json({ success: true, data: registrations });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudentRegistrations = getStudentRegistrations;
const cancelRegistration = async (req, res) => {
    try {
        const userId = req.user._id;
        const reason = req.body?.reason || req.query?.reason;
        await registrationService.cancelRegistration(req.params.id, reason, userId);
        res.json({ success: true, message: 'Registration cancelled' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.cancelRegistration = cancelRegistration;
const deleteRegistration = async (req, res) => {
    try {
        const userId = req.user._id;
        await registrationService.removeRegistration(req.params.id, userId);
        res.json({ success: true, message: 'Registration deleted permanently' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteRegistration = deleteRegistration;
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.user._id;
        const registration = await registrationService.updateRegistrationStatus(req.params.id, status, userId);
        res.json({ success: true, data: registration });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateStatus = updateStatus;
const report = async (req, res) => {
    try {
        const { chestNumber } = req.body;
        if (!chestNumber)
            return res.status(400).json({ success: false, message: 'Chest number is required' });
        const userId = req.user._id;
        const registration = await registrationService.reportRegistration(req.params.id, chestNumber, userId);
        res.json({ success: true, data: registration });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.report = report;
const updateRegistrationSchema = zod_1.z.object({
    participants: zod_1.z.array(zod_1.z.string()).min(1),
});
const updateRegistration = async (req, res) => {
    try {
        const { participants } = updateRegistrationSchema.parse(req.body);
        const userId = req.user._id;
        const registration = await registrationService.updateRegistrationParticipants(req.params.id, participants, userId);
        res.json({ success: true, data: registration });
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
exports.updateRegistration = updateRegistration;
const getCollegePrograms = async (req, res) => {
    try {
        const programs = await registrationService.getProgramsByCollege(req.params.collegeId);
        res.json({ success: true, data: programs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCollegePrograms = getCollegePrograms;
