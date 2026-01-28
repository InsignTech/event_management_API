import axios from 'axios';
import Blacklist from '../models/Blacklist';

const WHATSAPP_API_URL = 'https://api.connectpanels.com/whatsapp-api/v1.0/customer/123223/bot/4931fde08cf84fde/template';
const AUTHORIZATION_TOKEN = '06e0c38d-222c-4a10-8143-644b5e4794c4-IvnNFTA';
const NAMESPACE = '1326deec_3440_4aa4_99fa_bd2aede3a472';

const formatPhone = (rawPhone: string): string | null => {
    let phone = rawPhone.trim();
    if (phone.length === 10) {
        return `91${phone}`;
    } else if (phone.length === 12 && phone.startsWith('91')) {
        return phone;
    }
    return null;
};

const isBlacklisted = async (phone: string): Promise<boolean> => {
    const entry = await Blacklist.findOne({ phone: phone.trim() });
    return !!entry;
};

export const sendCoordinatorNotification = async (rawPhone: string, params: {
    collegeName: string;
    programName: string;
    programDate: string;
    venue: string;
    time: string;
}) => {
    try {
        const phone = formatPhone(rawPhone);
        if (!phone) return false;
        if (await isBlacklisted(rawPhone)) return false;

        const payload = {
            payload: {
                name: "registrationcompletedcoordinator",
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: params.collegeName },
                            { type: "text", text: params.programName },
                            { type: "text", text: params.programDate },
                            { type: "text", text: params.venue },
                            { type: "text", text: params.time }
                        ]
                    }
                ],
                language: { code: "en_US", policy: "deterministic" },
                namespace: NAMESPACE
            },
            phoneNumber: phone
        };

        const response = await axios.post(WHATSAPP_API_URL, payload, {
            headers: {
                'Authorization': `Basic ${AUTHORIZATION_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Coordinator WhatsApp Sent to ${phone}:`, response.data);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending coordinator WhatsApp:', error.response?.data || error.message);
        return false;
    }
};

export const sendStudentNotification = async (rawPhone: string, params: {
    studentName: string;
    collegeName: string;
    programName: string;
    programDate: string;
    venue: string;
    time: string;
}) => {
    try {
        const phone = formatPhone(rawPhone);
        if (!phone) return false;
        if (await isBlacklisted(rawPhone)) return false;

        const payload = {
            payload: {
                name: "registrationupdatestudent",
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: params.studentName },
                            { type: "text", text: params.studentName },
                            { type: "text", text: params.collegeName },
                            { type: "text", text: params.programName },
                            { type: "text", text: params.programDate },
                            { type: "text", text: params.venue },
                            { type: "text", text: params.time },
                            { type: "text", text: "30" }
                        ]
                    },
                    {
                        index: 0,
                        parameters: [
                            { payload: "flow_registration_path", type: "payload" }
                        ],
                        sub_type: "quick_reply",
                        type: "button"
                    }
                ],
                language: { code: "en_US", policy: "deterministic" },
                namespace: NAMESPACE
            },
            phoneNumber: phone
        };

        const response = await axios.post(WHATSAPP_API_URL, payload, {
            headers: {
                'Authorization': `Basic ${AUTHORIZATION_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Student WhatsApp Sent to ${phone}:`, response.data);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending student WhatsApp:', error.response?.data || error.message);
        return false;
    }
};

export const sendScheduleChangeNotification = async (rawPhone: string, params: {
    programName: string;
    date: string;
    time: string;
    venue: string;
}) => {
    try {
        const phone = formatPhone(rawPhone);
        if (!phone) return false;
        if (await isBlacklisted(rawPhone)) return false;

        const payload = {
            payload: {
                name: "schedulechange",
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: params.programName },
                            { type: "text", text: params.date },
                            { type: "text", text: params.time },
                            { type: "text", text: params.venue }
                        ]
                    },
                    {
                        index: 0,
                        parameters: [
                            { payload: "flow_registration_path", type: "payload" }
                        ],
                        sub_type: "quick_reply",
                        type: "button"
                    }
                ],
                language: { code: "en_US", policy: "deterministic" },
                namespace: NAMESPACE
            },
            phoneNumber: phone
        };

        const response = await axios.post(WHATSAPP_API_URL, payload, {
            headers: {
                'Authorization': `Basic ${AUTHORIZATION_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Schedule Change WhatsApp Sent to ${phone}:`, response.data);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending schedule change WhatsApp:', error.response?.data || error.message);
        return false;
    }
};

