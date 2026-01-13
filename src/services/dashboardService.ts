import College from '../models/College';
import Student from '../models/Student';
import Registration from '../models/Registration';
import Program from '../models/Program';
import EventModel from '../models/Event';

export const getStats = async () => {
    const [totalColleges, totalPrograms, totalStudents, totalRegistrations] = await Promise.all([
        College.countDocuments(),
        Program.countDocuments(),
        Student.countDocuments(),
        Registration.countDocuments()
    ]);

    return {
        totalColleges,
        totalPrograms,
        totalStudents,
        totalRegistrations
    };
};

export const getRecentRegistrations = async (limit: number = 5) => {
    return await Registration.find()
        .sort({ registeredAt: -1 })
        .limit(limit)
        .populate('program')
        .populate('participants', 'name universityRegNo');
};

export const getEventStatus = async () => {
    const [upcoming, ongoing, completed] = await Promise.all([
        EventModel.countDocuments({ status: 'upcoming' }),
        EventModel.countDocuments({ status: 'ongoing' }),
        EventModel.countDocuments({ status: 'completed' })
    ]);

    const activeEvents = await EventModel.find({ status: 'ongoing' })
        .select('name venue startDate endDate')
        .limit(5);

    return {
        counts: { upcoming, ongoing, completed },
        activeEvents
    };
};
