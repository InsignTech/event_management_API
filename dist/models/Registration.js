"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["OPEN"] = "open";
    RegistrationStatus["CONFIRMED"] = "confirmed";
    RegistrationStatus["REPORTED"] = "reported";
    RegistrationStatus["PARTICIPATED"] = "participated";
    RegistrationStatus["ABSENT"] = "absent";
    RegistrationStatus["CANCELLED"] = "cancelled";
    RegistrationStatus["REJECTED"] = "rejected";
    RegistrationStatus["COMPLETED"] = "completed";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
const registrationSchema = new mongoose_1.Schema({
    program: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Program',
        required: true,
    },
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        }],
    chestNumber: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: Object.values(RegistrationStatus),
        default: RegistrationStatus.OPEN,
    },
    cancellationReason: {
        type: String,
    },
    pointsObtained: {
        type: Number,
        default: 0,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    },
    createduserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastUpdateduserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: false, // We use registeredAt
});
// Compound index to ensure unique chest number per program, but only if chestNumber is assigned
registrationSchema.index({ program: 1, chestNumber: 1 }, {
    unique: true,
    partialFilterExpression: { chestNumber: { $type: "string" } }
});
// Note: Ensure application logic handles checking if a student is already registered in a program
// Or use a more complex validation validator if needed as Multikey indexes have limitations for this specific uniqueness check directly on array content efficiently for all cases
const Registration = mongoose_1.default.model('Registration', registrationSchema);
exports.default = Registration;
