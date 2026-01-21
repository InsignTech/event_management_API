"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const generateQRCode = async (text) => {
    try {
        return await qrcode_1.default.toDataURL(text);
    }
    catch (err) {
        console.error('QR Code Generation Error:', err);
        throw new Error('Failed to generate QR Code');
    }
};
exports.generateQRCode = generateQRCode;
