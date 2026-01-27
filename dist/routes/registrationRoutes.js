"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registrationController_1 = require("../controllers/registrationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Read operations - allow program_reporting
router.route('/')
    .get((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), registrationController_1.getAll)
    .post((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION), registrationController_1.register);
router.route('/:id')
    .put((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION), registrationController_1.updateRegistration)
    .delete((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION), registrationController_1.deleteRegistration);
// Status updates - allow program_reporting
router.post('/:id/cancel', (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), registrationController_1.cancelRegistration);
router.patch('/:id/status', (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), registrationController_1.updateStatus);
router.post('/:id/report', (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), registrationController_1.report);
// Read operations - allow program_reporting
router.get('/college/:collegeId/programs', (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING, User_1.UserRole.SCORING), registrationController_1.getCollegePrograms);
router.get('/college/:collegeId', (0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), registrationController_1.getCollegeRegistrations);
router.route('/program/:programId')
    .get((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING, User_1.UserRole.SCORING), registrationController_1.getRegistrations);
router.route('/student/:studentId')
    .get((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR, User_1.UserRole.REGISTRATION, User_1.UserRole.PROGRAM_REPORTING), registrationController_1.getStudentRegistrations);
exports.default = router;
