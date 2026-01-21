"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
// import { sendWhatsAppReminder } from '../services/reminderService'; // Implement later
const initCronJobs = () => {
    // Schedule tasks
    // Example: Run every hour to check for upcoming events in 1 hour
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('Running hourly reminder job...');
        // logic to find events starting in 1 hour and send WA
    });
};
exports.default = initCronJobs;
