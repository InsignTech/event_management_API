import mongoose, { Document, Schema } from 'mongoose';

export enum RegistrationStatus {
    REGISTERED = 'registered',
    CHECKED_IN = 'checked_in',
    DISQUALIFIED = 'disqualified',
    COMPLETED = 'completed',
}

export interface IRegistration extends Document {
    program: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[]; // Reference to Student Profile(s)
    chestNumber: string;
    status: RegistrationStatus;
    pointsObtained?: number; // For leaderboard
    rank?: number;
    registeredAt: Date;
    createduserId: mongoose.Types.ObjectId;
}

const registrationSchema = new Schema<IRegistration>(
    {
        program: {
            type: Schema.Types.ObjectId,
            ref: 'Program',
            required: true,
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        }],
        chestNumber: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(RegistrationStatus),
            default: RegistrationStatus.REGISTERED,
        },
        pointsObtained: {
            type: Number,
            default: 0,
        },
        rank: {
            type: Number,
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
         createduserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: false, // We use registeredAt
    }
);

// Compound index to ensure unique chest number per program
registrationSchema.index({ program: 1, chestNumber: 1 }, { unique: true });

// Note: Ensure application logic handles checking if a student is already registered in a program
// Or use a more complex validation validator if needed as Multikey indexes have limitations for this specific uniqueness check directly on array content efficiently for all cases


const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
export default Registration;
