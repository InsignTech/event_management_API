import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    EVENT_ADMIN = 'event_admin',
    COORDINATOR = 'coordinator',
    REGISTRATION = 'registration',
    PROGRAM_REPORTING = 'program_reporting',
    SCORING = 'scoring',
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string; // Optional because we might verify password separately or not select it
    role: UserRole;
    phone?: string;
    college?: mongoose.Types.ObjectId; // Reference to College
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.COORDINATOR,
        },
        phone: {
            type: String,
        },
        college: {
            type: Schema.Types.ObjectId,
            ref: 'College',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    if (this.password) {
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
