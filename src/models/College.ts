import mongoose, { Document, Schema } from 'mongoose';

export enum CollegeStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface ICollege extends Document {
    name: string;
    address: string;
    coordinatorName: string;
    coordinatorEmail: string;
    coordinatorPhone: string;
    logo?: string;
    status: CollegeStatus;
    createdAt: Date;
    updatedAt: Date;
}

const collegeSchema = new Schema<ICollege>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
        },
        coordinatorName: {
            type: String,
            required: true,
        },
        coordinatorEmail: {
            type: String,
            required: true,
        },
        coordinatorPhone: {
            type: String,
            required: true,
        },
        logo: {
            type: String, // URL
        },
        status: {
            type: String,
            enum: Object.values(CollegeStatus),
            default: CollegeStatus.PENDING,
        },
    },
    {
        timestamps: true,
    }
);

const College = mongoose.model<ICollege>('College', collegeSchema);
export default College;
