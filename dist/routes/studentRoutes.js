"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const studentController_1 = require("../controllers/studentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect); // All routes require login
router.use((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR));
router.route('/')
    .get(studentController_1.getStudents)
    .post(studentController_1.createStudent);
router.route('/:id')
    .get(studentController_1.getStudent)
    .put(studentController_1.updateStudent)
    .delete(studentController_1.deleteStudent);
exports.default = router;
