"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const collegeController_1 = require("../controllers/collegeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.route('/')
    .get(authMiddleware_1.protect, collegeController_1.getAll)
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN), collegeController_1.create);
router.route('/:id')
    .get(authMiddleware_1.protect, collegeController_1.getById)
    .put(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN), collegeController_1.update)
    .delete(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN), collegeController_1.remove);
exports.default = router;
