import mongoose, { Document, Schema } from 'mongoose';

export enum EventStatus {
    UPCOMING = 'upcoming',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
}

export interface IEvent extends Document {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    venue: string; // Main venue
    status: EventStatus;
    isActive: boolean;
    createduserId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        venue: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(EventStatus),
            default: EventStatus.UPCOMING,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createduserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Event = mongoose.model<IEvent>('Event', eventSchema);
export default Event;
