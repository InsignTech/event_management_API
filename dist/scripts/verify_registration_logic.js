"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const Program_1 = __importStar(require("../models/Program"));
const Registration_1 = __importStar(require("../models/Registration"));
const User_1 = __importStar(require("../models/User"));
const Student_1 = __importDefault(require("../models/Student"));
const Event_1 = __importDefault(require("../models/Event"));
const registrationService = __importStar(require("../services/registrationService"));
dotenv_1.default.config();
const testVerification = async () => {
    try {
        await (0, db_1.connectDB)();
        console.log('Connected to DB');
        // 0. Cleanup any previous failed runs
        await User_1.default.deleteMany({ email: /test_.*@test.com/ });
        await Student_1.default.deleteMany({ name: 'Test Student' });
        // 1. Setup - Create Test User, Event, Program, Student
        const testUser = await User_1.default.create({
            name: 'Test Admin',
            email: 'test_admin@test.com',
            password: 'password',
            role: User_1.UserRole.ADMIN
        });
        // Need a real-looking ObjectId for college
        const collegeId = new mongoose_1.default.Types.ObjectId();
        const testEvent = await Event_1.default.create({
            name: 'Test Event ' + Date.now(),
            venue: 'Test Event Venue',
            startDate: new Date(),
            endDate: new Date(),
            description: 'Test',
            createduserId: testUser._id
        });
        const testProgram = await Program_1.default.create({
            event: testEvent._id,
            name: 'Test Program ' + Date.now(),
            type: Program_1.ProgramType.SINGLE,
            category: Program_1.ProgramCategory.ON_STAGE,
            venue: 'Test Venue',
            startTime: new Date(),
            duration: 30,
            createduserId: testUser._id
        });
        const testStudent = await Student_1.default.create({
            name: 'Test Student',
            registrationCode: 'TEST' + Date.now(),
            college: collegeId,
            department: 'Test Dept',
            phone: '1234567890',
            email: 'student' + Date.now() + '@test.com',
            gender: 'male',
            createduserId: testUser._id
        });
        console.log('Setup complete');
        // 2. Test Registration Creation
        let registration;
        try {
            registration = await registrationService.registerForProgram([testStudent._id.toString()], testProgram._id.toString(), testUser._id.toString());
            console.log('Registration created:', registration._id);
        }
        catch (err) {
            console.error('Registration creation failed:', err.message);
            if (err.errors)
                console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
            throw err;
        }
        console.log('Initial lastUpdateduserId:', registration.lastUpdateduserId);
        if (registration.createduserId.toString() !== testUser._id.toString() || registration.lastUpdateduserId.toString() !== testUser._id.toString()) {
            throw new Error('User IDs not set correctly on creation');
        }
        // 3. Test Update Registration
        const anotherUser = await User_1.default.create({
            name: 'Another Admin',
            email: 'another_admin@test.com',
            password: 'password',
            role: User_1.UserRole.ADMIN
        });
        await registrationService.updateRegistrationStatus(registration._id.toString(), Registration_1.RegistrationStatus.REPORTED, anotherUser._id.toString());
        const updatedReg = await Registration_1.default.findById(registration._id);
        console.log('Registration updated by:', updatedReg?.lastUpdateduserId);
        if (updatedReg?.lastUpdateduserId.toString() !== anotherUser._id.toString()) {
            throw new Error('lastUpdateduserId not updated correctly');
        }
        // 4. Test Restriction after Result Publish
        await Program_1.default.findByIdAndUpdate(testProgram._id, { isResultPublished: true });
        console.log('Program results published');
        try {
            await registrationService.updateRegistrationStatus(registration._id.toString(), Registration_1.RegistrationStatus.COMPLETED, testUser._id.toString());
            throw new Error('Should have failed to update status after publication');
        }
        catch (error) {
            console.log('Update status restriction caught:', error.message);
        }
        try {
            await registrationService.reportRegistration(registration._id.toString(), '999', testUser._id.toString());
            throw new Error('Should have failed to report after publication');
        }
        catch (error) {
            console.log('Report restriction caught:', error.message);
        }
        try {
            await registrationService.cancelRegistration(registration._id.toString(), 'No reason', testUser._id.toString());
            throw new Error('Should have failed to cancel after publication');
        }
        catch (error) {
            console.log('Cancel restriction caught:', error.message);
        }
        try {
            await registrationService.removeRegistration(registration._id.toString(), testUser._id.toString());
            throw new Error('Should have failed to delete after publication');
        }
        catch (error) {
            console.log('Delete restriction caught:', error.message);
        }
        // 5. Test Restriction for Cancelled/Rejected Status
        // Re-enable editing by unpublishing results temporarily for this test
        await Program_1.default.findByIdAndUpdate(testProgram._id, { isResultPublished: false });
        // Cancel the registration using a new one if the old one is "stuck" in published state (but we just unpublished it)
        // Wait, the current registration is already reported. Let's cancel it.
        await registrationService.cancelRegistration(registration._id.toString(), 'Verification Test', testUser._id.toString());
        console.log('Registration cancelled manually');
        try {
            await registrationService.updateRegistrationStatus(registration._id.toString(), Registration_1.RegistrationStatus.CONFIRMED, testUser._id.toString());
            throw new Error('Should have failed to update status of cancelled registration');
        }
        catch (error) {
            console.log('Cancelled status restriction caught:', error.message);
            if (error.message !== 'Cannot update a cancelled or rejected registration') {
                throw new Error('Wrong error message for cancelled status restriction');
            }
        }
        console.log('All verification tests passed!');
        // Cleanup
        await Registration_1.default.deleteMany({ program: testProgram._id });
        await Program_1.default.findByIdAndDelete(testProgram._id);
        await Event_1.default.findByIdAndDelete(testEvent._id);
        await Student_1.default.findByIdAndDelete(testStudent._id);
        await User_1.default.findByIdAndDelete(testUser._id);
        await User_1.default.findByIdAndDelete(anotherUser._id);
        console.log('Cleanup complete');
        process.exit(0);
    }
    catch (error) {
        console.error('Verification failed:', error.message);
        if (error.errors)
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        process.exit(1);
    }
};
testVerification();
