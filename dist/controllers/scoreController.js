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
exports.getLeaderboard = exports.submit = void 0;
const scoreService = __importStar(require("../services/scoreService"));
const zod_1 = require("zod");
const scoreSchema = zod_1.z.object({
    programId: zod_1.z.string(),
    registrationId: zod_1.z.string(),
    criteria: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
});
const submit = async (req, res) => {
    try {
        const data = scoreSchema.parse(req.body);
        // judgeId from logged in user (Admin/Event Admin acting as Judge)
        const judgeId = req.user._id.toString();
        const score = await scoreService.submitScore({
            programId: data.programId,
            registrationId: data.registrationId,
            judgeId,
            criteria: data.criteria
        });
        res.status(201).json({ success: true, data: score });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
        }
        else {
            // Handle unique index error (Judge already scored)
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
exports.submit = submit;
const getLeaderboard = async (req, res) => {
    try {
        // TODO: Implement full leaderboard fetch
        // For now returning empty or mocked
        const leaderboard = await scoreService.getLeaderboard();
        res.json({ success: true, data: leaderboard });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeaderboard = getLeaderboard;
