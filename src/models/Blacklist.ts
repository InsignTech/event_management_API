import mongoose, { Document, Schema } from 'mongoose';

export interface IBlacklist extends Document {
    phone: string;
    reason?: string;
    createdAt: Date;
}

const blacklistSchema = new Schema<IBlacklist>(
    {
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
        },
        reason: {
            type: String,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Create index for fast phone lookups
blacklistSchema.index({ phone: 1 });

const Blacklist = mongoose.model<IBlacklist>('Blacklist', blacklistSchema);
export default Blacklist;
