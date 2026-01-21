"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scoreController_1 = require("../controllers/scoreController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.route('/submit')
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN), scoreController_1.submit);
router.route('/leaderboard')
    .get(scoreController_1.getLeaderboard); // Public leaderboard
exports.default = router;
