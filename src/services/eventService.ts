import Event, { IEvent } from '../models/Event';

export const createEvent = async (data: Partial<IEvent>) => {
    const existing = await Event.findOne({ name: data.name });
    if (existing) {
        throw new Error('Event already exists');
    }
    return await Event.create(data);
};

export const getEvents = async (query: any = {}) => {
    return await Event.find(query);
};

export const getEventById = async (id: string) => {
    const event = await Event.findById(id);
    if (!event) throw new Error('Event not found');
    return event;
};

export const updateEvent = async (id: string, data: Partial<IEvent>) => {
    const event = await Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!event) throw new Error('Event not found');
    return event;
};

export const deleteEvent = async (id: string) => {
    const event = await Event.findByIdAndDelete(id);
    if (!event) throw new Error('Event not found');
    return event;
};
