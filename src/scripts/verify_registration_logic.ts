import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import Program, { ProgramType, ProgramCategory } from '../models/Program';
import Registration, { RegistrationStatus } from '../models/Registration';
import User, { UserRole } from '../models/User';
import Student from '../models/Student';
import Event from '../models/Event';
import * as registrationService from '../services/registrationService';

dotenv.config();

const testVerification = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 0. Cleanup any previous failed runs
        await User.deleteMany({ email: /test_.*@test.com/ });
        await Student.deleteMany({ name: 'Test Student' });

        // 1. Setup - Create Test User, Event, Program, Student
        const testUser = await User.create({
            name: 'Test Admin',
            email: 'test_admin@test.com',
            password: 'password',
            role: UserRole.ADMIN
        });

        // Need a real-looking ObjectId for college
        const collegeId = new mongoose.Types.ObjectId();

        const testEvent = await Event.create({
            name: 'Test Event ' + Date.now(),
            location: 'Test Venue',
            startDate: new Date(),
            endDate: new Date(),
            description: 'Test'
        });

        const testProgram = await Program.create({
            event: testEvent._id,
            name: 'Test Program ' + Date.now(),
            type: ProgramType.SINGLE,
            category: ProgramCategory.ON_STAGE,
            venue: 'Test Venue',
            startTime: new Date(),
            duration: 30,
            createduserId: testUser._id
        });

        const testStudent = await Student.create({
            name: 'Test Student',
            registrationCode: 'TEST' + Date.now(),
            college: collegeId,
            department: 'Test Dept',
            phone: '1234567890',
            email: 'student' + Date.now() + '@test.com',
            gender: 'male'
        });

        console.log('Setup complete');

        // 2. Test Registration Creation
        let registration;
        try {
            registration = await registrationService.registerForProgram([testStudent._id.toString()], testProgram._id.toString(), testUser._id.toString());
            console.log('Registration created:', registration._id);
        } catch (err: any) {
            console.error('Registration creation failed:', err.message);
            if (err.errors) console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
            throw err;
        }

        console.log('Initial lastUpdateduserId:', registration.lastUpdateduserId);

        if (registration.createduserId.toString() !== testUser._id.toString() || registration.lastUpdateduserId.toString() !== testUser._id.toString()) {
            throw new Error('User IDs not set correctly on creation');
        }

        // 3. Test Update Registration
        const anotherUser = await User.create({
            name: 'Another Admin',
            email: 'another_admin@test.com',
            password: 'password',
            role: UserRole.ADMIN
        });

        await registrationService.updateRegistrationStatus(registration._id.toString(), RegistrationStatus.REPORTED, anotherUser._id.toString());
        const updatedReg = await Registration.findById(registration._id);
        console.log('Registration updated by:', updatedReg?.lastUpdateduserId);

        if (updatedReg?.lastUpdateduserId.toString() !== anotherUser._id.toString()) {
            throw new Error('lastUpdateduserId not updated correctly');
        }

        // 4. Test Restriction after Result Publish
        await Program.findByIdAndUpdate(testProgram._id, { isResultPublished: true });
        console.log('Program results published');

        try {
            await registrationService.updateRegistrationStatus(registration._id.toString(), RegistrationStatus.COMPLETED, testUser._id.toString());
            throw new Error('Should have failed to update status after publication');
        } catch (error: any) {
            console.log('Update status restriction caught:', error.message);
        }

        try {
            await registrationService.reportRegistration(registration._id.toString(), '999', testUser._id.toString());
            throw new Error('Should have failed to report after publication');
        } catch (error: any) {
            console.log('Report restriction caught:', error.message);
        }

        try {
            await registrationService.cancelRegistration(registration._id.toString(), 'No reason', testUser._id.toString());
            throw new Error('Should have failed to cancel after publication');
        } catch (error: any) {
            console.log('Cancel restriction caught:', error.message);
        }

        try {
            await registrationService.removeRegistration(registration._id.toString(), testUser._id.toString());
            throw new Error('Should have failed to delete after publication');
        } catch (error: any) {
            console.log('Delete restriction caught:', error.message);
        }

        console.log('All verification tests passed!');

        // Cleanup
        await Registration.deleteMany({ program: testProgram._id });
        await Program.findByIdAndDelete(testProgram._id);
        await Event.findByIdAndDelete(testEvent._id);
        await Student.findByIdAndDelete(testStudent._id);
        await User.findByIdAndDelete(testUser._id);
        await User.findByIdAndDelete(anotherUser._id);
        console.log('Cleanup complete');

        process.exit(0);
    } catch (error: any) {
        console.error('Verification failed:', error.message);
        if (error.errors) console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        process.exit(1);
    }
};

testVerification();
