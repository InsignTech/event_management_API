"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsApp = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_1 = __importDefault(require("twilio"));
const env_1 = require("../utils/env");
// Email Transporter
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// Twilio Client
const twilioClient = env_1.env.JWT_SECRET ? (0, twilio_1.default)(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) : null;
// Note: We use env check just to see if we should init, effectively we need TWILIO_SID
const sendEmail = async (to, subject, html) => {
    if (process.env.NODE_ENV === 'test')
        return;
    try {
        const info = await transporter.sendMail({
            from: '"Event Admin" <admin@example.com>',
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
    }
    catch (error) {
        console.error('Email send error:', error);
        // Don't throw to avoid breaking the registration flow, just log
    }
};
exports.sendEmail = sendEmail;
const sendWhatsApp = async (to, body) => {
    if (!process.env.TWILIO_SID) {
        console.log('Skipping WhatsApp: No Twilio Creds. Body:', body);
        return;
    }
    try {
        if (twilioClient) {
            await twilioClient.messages.create({
                body,
                from: process.env.TWILIO_PHONE,
                to: `whatsapp:${to}`,
            });
        }
    }
    catch (error) {
        console.error('WhatsApp send error:', error);
    }
};
exports.sendWhatsApp = sendWhatsApp;
