import mongoose, { Document, Schema } from 'mongoose';

export enum ProgramType {
    SINGLE = 'single',
    GROUP = 'group',
}

export enum ProgramCategory {
    ON_STAGE = 'on_stage',
    OFF_STAGE = 'off_stage',
}

export interface IProgram extends Document {
    event: mongoose.Types.ObjectId;
    name: string;
    type: ProgramType;
    category: ProgramCategory;
    venue: string; // Specific venue
    startTime: Date;
    duration: number; // in minutes
    maxParticipants?: number; // Optional limit
    genderRestriction?: 'male' | 'female' | 'none';
    rules?: string[];
    coordinators?: mongoose.Types.ObjectId[];
    lastChestNumber: number;
    createduserId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    isResultPublished: boolean;
    isCancelled: boolean;
    cancellationReason?: string;
    lastUpdateduserId: mongoose.Types.ObjectId;
}

const programSchema = new Schema<IProgram>(
    {
        event: {
            type: Schema.Types.ObjectId,
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
                type: Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        lastChestNumber: {
            type: Number,
            default: 100,
        },
        createduserId: {
            type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Program = mongoose.model<IProgram>('Program', programSchema);
export default Program;
