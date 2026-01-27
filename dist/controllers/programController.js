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
exports.publish = exports.cancel = exports.remove = exports.update = exports.getById = exports.getAll = exports.getByEvent = exports.create = void 0;
const programService = __importStar(require("../services/programService"));
const scoreService = __importStar(require("../services/scoreService"));
const zod_1 = require("zod");
const Program_1 = require("../models/Program");
const createProgramSchema = zod_1.z.object({
    event: zod_1.z.string(),
    name: zod_1.z.string().min(3),
    type: zod_1.z.nativeEnum(Program_1.ProgramType).optional(),
    category: zod_1.z.nativeEnum(Program_1.ProgramCategory),
    venue: zod_1.z.string(),
    startTime: zod_1.z.coerce.date(),
    duration: zod_1.z.number().nonnegative().nullable(),
    maxParticipants: zod_1.z.number().optional(),
    genderRestriction: zod_1.z.enum(['male', 'female', 'none']).optional(),
    rules: zod_1.z.array(zod_1.z.string()).optional(),
    coordinators: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateProgramSchema = createProgramSchema.partial();
const create = async (req, res) => {
    try {
        const data = createProgramSchema.parse(req.body);
        const program = await programService.createProgram({
            ...data,
            createduserId: req.user._id
        });
        res.status(201).json({ success: true, data: program });
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
const getByEvent = async (req, res) => {
    try {
        const includeCancelled = req.query.includeCancelled === 'true';
        const programs = await programService.getProgramsByEvent(req.params.eventId, includeCancelled);
        res.json({ success: true, data: programs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getByEvent = getByEvent;
const getAll = async (req, res) => {
    try {
        const includeCancelled = req.query.includeCancelled === 'true';
        const programs = await programService.getAllPrograms(includeCancelled);
        res.json({ success: true, data: programs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const program = await programService.getProgramById(req.params.id);
        res.json({ success: true, data: program });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.getById = getById;
const update = async (req, res) => {
    try {
        const data = updateProgramSchema.parse(req.body);
        const userId = req.user._id;
        const program = await programService.updateProgram(req.params.id, data, userId);
        res.json({ success: true, data: program });
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
        await programService.deleteProgram(req.params.id);
        res.json({ success: true, message: 'Program removed' });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
exports.remove = remove;
const cancel = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user._id;
        const program = await programService.cancelProgram(req.params.id, reason, userId);
        res.json({ success: true, data: program });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.cancel = cancel;
const publish = async (req, res) => {
    try {
        await scoreService.publishResults(req.params.id, req.user._id);
        res.json({ success: true, message: 'Results published successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.publish = publish;
