"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exportController_1 = require("../controllers/exportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR));
router.get('/college-wise', exportController_1.exportCollegeWise);
router.get('/program-wise/:programId', exportController_1.exportProgramWise);
exports.default = router;
