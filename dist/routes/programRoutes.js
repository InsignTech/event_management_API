"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const programController_1 = require("../controllers/programController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Programs are usually fetched by Event
router.route('/event/:eventId')
    .get(programController_1.getByEvent);
router.route('/')
    .get(programController_1.getAll)
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.REGISTRATION), programController_1.create);
router.route('/:id')
    .get(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), programController_1.getById)
    .put(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.REGISTRATION), programController_1.update)
    .delete(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.REGISTRATION), programController_1.remove);
router.route('/:id/publish')
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.SCORING), programController_1.publish);
router.route('/:id/cancel')
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.REGISTRATION), programController_1.cancel);
exports.default = router;
