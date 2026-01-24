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
router.use((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN, User_1.UserRole.EVENT_ADMIN, User_1.UserRole.COORDINATOR));
router.route('/')
    .get(registrationController_1.getAll)
    .post(registrationController_1.register);
router.route('/:id')
    .put(registrationController_1.updateRegistration)
    .delete(registrationController_1.deleteRegistration);
router.post('/:id/cancel', registrationController_1.cancelRegistration);
router.patch('/:id/status', registrationController_1.updateStatus);
router.post('/:id/report', registrationController_1.report);
router.get('/college/:collegeId/programs', registrationController_1.getCollegePrograms);
router.route('/program/:programId')
    .get(registrationController_1.getRegistrations);
router.route('/student/:studentId')
    .get(registrationController_1.getStudentRegistrations);
exports.default = router;
