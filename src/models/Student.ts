import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
    name?: string;
    college: mongoose.Types.ObjectId;
    universityRegNo: string;
    course: string;
    year: string;
    gender: 'male' | 'female' | 'other';
    emergencyContact?: string;
    createdAt: Date;
    updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
    {
        name: {
            type: String,
        },
        college: {
            type: Schema.Types.ObjectId,
            ref: 'College',
            required: true,
        },
        universityRegNo: {
            type: String,
            required: true,
            unique: true,
        },
        course: {
            type: String,
            required: true,
        },
        year: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        emergencyContact: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Student = mongoose.model<IStudent>('Student', studentSchema);
export default Student;
