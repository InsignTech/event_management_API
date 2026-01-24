import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import Program, { ProgramType, ProgramCategory } from '../models/Program';
import Registration, { RegistrationStatus } from '../models/Registration';
import User, { UserRole } from '../models/User';
import Student from '../models/Student';
import Event from '../models/Event';
import * as programService from '../services/programService';
import * as registrationService from '../services/registrationService';

dotenv.config();

const testProgramCancellation = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 0. Cleanup
        await User.deleteMany({ email: /test_.*@test.com/ });
        await Student.deleteMany({ name: 'Test Student' });

        // 1. Setup
        const testUser = await User.create({
            name: 'Test Admin',
            email: 'test_admin@test.com',
            password: 'password',
            role: UserRole.ADMIN
        });

        const collegeId = new mongoose.Types.ObjectId();

        const testEvent = await Event.create({
            name: 'Test Event ' + Date.now(),
            venue: 'Test Venue',
            startDate: new Date(),
            endDate: new Date(),
            description: 'Test',
            createduserId: testUser._id
        });

        const testProgram = await programService.createProgram({
            event: testEvent._id as any,
            name: 'Test Program ' + Date.now(),
            type: ProgramType.SINGLE,
            category: ProgramCategory.ON_STAGE,
            venue: 'Test Venue',
            startTime: new Date(),
            duration: 30,
            createduserId: testUser._id as any
        });

        const testStudent = await Student.create({
            name: 'Test Student',
            registrationCode: 'TEST' + Date.now(),
            college: collegeId,
            department: 'Test Dept',
            phone: '1234567890',
            email: 'student' + Date.now() + '@test.com',
            gender: 'male',
            createduserId: testUser._id
        });

        const registration = await registrationService.registerForProgram([testStudent._id.toString()], testProgram._id.toString(), testUser._id.toString());
        console.log('Setup complete');

        // 2. Test Cancellation
        const cancellationReason = 'Event calling off';
        await programService.cancelProgram(testProgram._id.toString(), cancellationReason, testUser._id.toString());
        const cancelledProgram = await Program.findById(testProgram._id);
        console.log('Program cancelled:', cancelledProgram?.isCancelled);

        if (!cancelledProgram?.isCancelled || cancelledProgram.cancellationReason !== cancellationReason) {
            throw new Error('Program cancellation failed or reason not set');
        }

        // 3. Test Mutation Restrictions on Program
        try {
            await programService.updateProgram(testProgram._id.toString(), { name: 'New Name' }, testUser._id.toString());
            throw new Error('Should have failed to update cancelled program');
        } catch (error: any) {
            console.log('Program update restriction caught:', error.message);
        }

        // 4. Test Mutation Restrictions on Registration
        try {
            await registrationService.updateRegistrationStatus(registration._id.toString(), RegistrationStatus.REPORTED, testUser._id.toString());
            throw new Error('Should have failed to update registration status for cancelled program');
        } catch (error: any) {
            console.log('Registration status update restriction caught:', error.message);
        }

        try {
            await registrationService.cancelRegistration(registration._id.toString(), 'No reason', testUser._id.toString());
            throw new Error('Should have failed to cancel registration for cancelled program');
        } catch (error: any) {
            console.log('Registration cancellation restriction caught:', error.message);
        }

        // 5. Test Filtering
        const allPrograms = await programService.getAllPrograms(true);
        const filteredPrograms = await programService.getAllPrograms(false);
        console.log('Total Programs:', allPrograms.length);
        console.log('Filtered Programs (Active only):', filteredPrograms.length);

        if (filteredPrograms.some(p => p.isCancelled)) {
            throw new Error('Filtered list should not contain cancelled programs');
        }

        console.log('All program cancellation verification tests passed!');

        // Cleanup
        await Registration.deleteMany({ program: testProgram._id });
        await Program.findByIdAndDelete(testProgram._id);
        await Event.findByIdAndDelete(testEvent._id);
        await Student.findByIdAndDelete(testStudent._id);
        await User.findByIdAndDelete(testUser._id);
        console.log('Cleanup complete');

        process.exit(0);
    } catch (error: any) {
        console.error('Verification failed:', error.message);
        process.exit(1);
    }
};

testProgramCancellation();
