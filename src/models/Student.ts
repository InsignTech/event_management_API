import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
    name: string;
    college: mongoose.Types.ObjectId;
    registrationCode: string;
    phone: string;
    course: string;
    year?: string;
    gender: 'male' | 'female' | 'other';
    emergencyContact?: string;
    createdAt: Date;
    updatedAt: Date;
    createduserId: mongoose.Types.ObjectId;
}

const studentSchema = new Schema<IStudent>(
    {
        name: {
            type: String,
            required: true,
        },
        college: {
            type: Schema.Types.ObjectId,
            ref: 'College',
            required: true,
        },
        registrationCode: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
        },
        course: {
            type: String,
        },
        year: {
            type: String,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        emergencyContact: {
            type: String,
        },
        createduserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            default: null
        }
    },
    {
        timestamps: true,
    }
);

const Student = mongoose.model<IStudent>('Student', studentSchema);
export default Student;
