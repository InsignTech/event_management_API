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
exports.getProgramResults = exports.getPrograms = exports.getLeaderboard = exports.getSchedule = void 0;
const publicService = __importStar(require("../services/publicService"));
const getSchedule = async (req, res) => {
    try {
        const schedule = await publicService.getPublicSchedule();
        res.json({ success: true, data: schedule });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSchedule = getSchedule;
const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await publicService.getPublicLeaderboard();
        res.json({ success: true, data: leaderboard });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeaderboard = getLeaderboard;
const getPrograms = async (req, res) => {
    try {
        const programs = await publicService.getPublicPrograms();
        res.json({ success: true, data: programs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPrograms = getPrograms;
const getProgramResults = async (req, res) => {
    try {
        const { programId } = req.params;
        const results = await publicService.getProgramResults(programId);
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProgramResults = getProgramResults;
