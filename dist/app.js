"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const error_1 = require("./middleware/error");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const collegeRoutes_1 = __importDefault(require("./routes/collegeRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const programRoutes_1 = __importDefault(require("./routes/programRoutes"));
const registrationRoutes_1 = __importDefault(require("./routes/registrationRoutes"));
const scoreRoutes_1 = __importDefault(require("./routes/scoreRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const publicRoutes_1 = __importDefault(require("./routes/publicRoutes"));
const exportRoutes_1 = __importDefault(require("./routes/exportRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/colleges', collegeRoutes_1.default);
app.use('/api/students', studentRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/programs', programRoutes_1.default);
app.use('/api/registrations', registrationRoutes_1.default);
app.use('/api/scores', scoreRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/public', publicRoutes_1.default);
app.use('/api/exports', exportRoutes_1.default);
// Error Handler
app.use(error_1.errorHandler);
exports.default = app;
