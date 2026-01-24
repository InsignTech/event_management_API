import mongoose, { Document, Schema } from 'mongoose';

export enum RegistrationStatus {
    OPEN = 'open',
    CONFIRMED = 'confirmed',
    REPORTED = 'reported',
    PARTICIPATED = 'participated',
    ABSENT = 'absent',
    CANCELLED = 'cancelled',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
}

export interface IRegistration extends Document {
    program: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[]; // Reference to Student Profile(s)
    chestNumber: string;
    status: RegistrationStatus;
    cancellationReason?: string;
    pointsObtained?: number; // For leaderboard
    registeredAt: Date;
    createduserId: mongoose.Types.ObjectId;
    lastUpdateduserId: mongoose.Types.ObjectId;
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
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lastUpdateduserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: false, // We use registeredAt
    }
);

// Compound index to ensure unique chest number per program, but only if chestNumber is assigned
registrationSchema.index(
    { program: 1, chestNumber: 1 },
    {
        unique: true,
        partialFilterExpression: { chestNumber: { $type: "string" } }
    }
);

// Note: Ensure application logic handles checking if a student is already registered in a program
// Or use a more complex validation validator if needed as Multikey indexes have limitations for this specific uniqueness check directly on array content efficiently for all cases


const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
export default Registration;
