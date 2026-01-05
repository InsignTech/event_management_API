import mongoose, { Document, Schema } from 'mongoose';

export interface IScore extends Document {
    program: mongoose.Types.ObjectId;
    registration: mongoose.Types.ObjectId; // Links to Student's registration (chest no)
    judgeId: string; // Identifier for the judge
    criteria: Record<string, number>; // e.g., { "Creativity": 10, "Execution": 8 }
    totalPoints: number;
}

const scoreSchema = new Schema<IScore>(
    {
        program: {
            type: Schema.Types.ObjectId,
            ref: 'Program',
            required: true,
        },
        registration: {
            type: Schema.Types.ObjectId,
            ref: 'Registration',
            required: true,
        },
        judgeId: {
            type: String,
            required: true,
        },
        criteria: {
            type: Map,
            of: Number,
            default: {},
        },
        totalPoints: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// One judge can only score a registration once per program
scoreSchema.index({ program: 1, registration: 1, judgeId: 1 }, { unique: true });

const Score = mongoose.model<IScore>('Score', scoreSchema);
export default Score;
