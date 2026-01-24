"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const publicController_1 = require("../controllers/publicController");
const router = express_1.default.Router();
router.get('/schedule', publicController_1.getSchedule);
router.get('/stats', publicController_1.getStats);
router.get('/leaderboard', publicController_1.getLeaderboard);
router.get('/programs', publicController_1.getPrograms);
router.get('/results/:programId', publicController_1.getProgramResults);
exports.default = router;
