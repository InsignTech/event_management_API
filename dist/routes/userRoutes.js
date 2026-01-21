"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/search', userController_1.search);
// Admin only routes
router.use((0, authMiddleware_1.authorize)(User_1.UserRole.SUPER_ADMIN));
router.get('/', userController_1.getAll);
router.post('/', userController_1.create);
router.put('/:id', userController_1.update);
router.delete('/:id', userController_1.remove);
exports.default = router;
