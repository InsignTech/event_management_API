import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import { connectDB } from '../config/db';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@gmail.com' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        const user = await User.create({
            name: 'Super Admin',
            email: 'admin@gmail.com',
            password: '1234',
            role: UserRole.SUPER_ADMIN,
        });

        console.log('Admin user created successfully');
        console.log('Email: admin@event.com');
        console.log('Password: password123');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
