import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { env } from '../utils/env';

// Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Twilio Client
const twilioClient = env.JWT_SECRET ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) : null;
// Note: We use env check just to see if we should init, effectively we need TWILIO_SID

export const sendEmail = async (to: string, subject: string, html: string) => {
    if (process.env.NODE_ENV === 'test') return;

    try {
        const info = await transporter.sendMail({
            from: '"Event Admin" <admin@example.com>',
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Email send error:', error);
        // Don't throw to avoid breaking the registration flow, just log
    }
};

export const sendWhatsApp = async (to: string, body: string) => {
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
    } catch (error) {
        console.error('WhatsApp send error:', error);
    }
};
