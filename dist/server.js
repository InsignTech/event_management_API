"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./utils/env");
const startServer = async () => {
    await (0, db_1.connectDB)();
    const PORT = env_1.env.PORT || 5000;
    app_1.default.listen(PORT, () => {
        console.log(`Server running in ${env_1.env.NODE_ENV} mode on port ${PORT}`);
    });
};
startServer();
