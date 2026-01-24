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
exports.ProgramCategory = exports.ProgramType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ProgramType;
(function (ProgramType) {
    ProgramType["SINGLE"] = "single";
    ProgramType["GROUP"] = "group";
})(ProgramType || (exports.ProgramType = ProgramType = {}));
var ProgramCategory;
(function (ProgramCategory) {
    ProgramCategory["ON_STAGE"] = "on_stage";
    ProgramCategory["OFF_STAGE"] = "off_stage";
})(ProgramCategory || (exports.ProgramCategory = ProgramCategory = {}));
const programSchema = new mongoose_1.Schema({
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: Object.values(ProgramType),
        default: ProgramType.SINGLE,
    },
    category: {
        type: String,
        enum: Object.values(ProgramCategory),
        required: true,
    },
    venue: {
        type: String,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
    },
    maxParticipants: {
        type: Number,
    },
    genderRestriction: {
        type: String,
        enum: ['male', 'female', 'none'],
        default: 'none',
    },
    rules: {
        type: [String],
    },
    coordinators: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    lastChestNumber: {
        type: Number,
        default: 100,
    },
    createduserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isResultPublished: {
        type: Boolean,
        default: false,
    },
    isCancelled: {
        type: Boolean,
        default: false,
    },
    cancellationReason: {
        type: String,
    },
    lastUpdateduserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
const Program = mongoose_1.default.model('Program', programSchema);
exports.default = Program;
