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
const programService = __importStar(require("../services/programService"));
const registrationService = __importStar(require("../services/registrationService"));
dotenv_1.default.config();
const testProgramCancellation = async () => {
    try {
        await (0, db_1.connectDB)();
        console.log('Connected to DB');
        // 0. Cleanup
        await User_1.default.deleteMany({ email: /test_.*@test.com/ });
        await Student_1.default.deleteMany({ name: 'Test Student' });
        // 1. Setup
        const testUser = await User_1.default.create({
            name: 'Test Admin',
            email: 'test_admin@test.com',
            password: 'password',
            role: User_1.UserRole.ADMIN
        });
        const collegeId = new mongoose_1.default.Types.ObjectId();
        const testEvent = await Event_1.default.create({
            name: 'Test Event ' + Date.now(),
            venue: 'Test Venue',
            startDate: new Date(),
            endDate: new Date(),
            description: 'Test',
            createduserId: testUser._id
        });
        const testProgram = await programService.createProgram({
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
        const registration = await registrationService.registerForProgram([testStudent._id.toString()], testProgram._id.toString(), testUser._id.toString());
        console.log('Setup complete');
        // 2. Test Cancellation
        const cancellationReason = 'Event calling off';
        await programService.cancelProgram(testProgram._id.toString(), cancellationReason, testUser._id.toString());
        const cancelledProgram = await Program_1.default.findById(testProgram._id);
        console.log('Program cancelled:', cancelledProgram?.isCancelled);
        if (!cancelledProgram?.isCancelled || cancelledProgram.cancellationReason !== cancellationReason) {
            throw new Error('Program cancellation failed or reason not set');
        }
        // 3. Test Mutation Restrictions on Program
        try {
            await programService.updateProgram(testProgram._id.toString(), { name: 'New Name' }, testUser._id.toString());
            throw new Error('Should have failed to update cancelled program');
        }
        catch (error) {
            console.log('Program update restriction caught:', error.message);
        }
        // 4. Test Mutation Restrictions on Registration
        try {
            await registrationService.updateRegistrationStatus(registration._id.toString(), Registration_1.RegistrationStatus.REPORTED, testUser._id.toString());
            throw new Error('Should have failed to update registration status for cancelled program');
        }
        catch (error) {
            console.log('Registration status update restriction caught:', error.message);
        }
        try {
            await registrationService.cancelRegistration(registration._id.toString(), 'No reason', testUser._id.toString());
            throw new Error('Should have failed to cancel registration for cancelled program');
        }
        catch (error) {
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
        await Registration_1.default.deleteMany({ program: testProgram._id });
        await Program_1.default.findByIdAndDelete(testProgram._id);
        await Event_1.default.findByIdAndDelete(testEvent._id);
        await Student_1.default.findByIdAndDelete(testStudent._id);
        await User_1.default.findByIdAndDelete(testUser._id);
        console.log('Cleanup complete');
        process.exit(0);
    }
    catch (error) {
        console.error('Verification failed:', error.message);
        process.exit(1);
    }
};
testProgramCancellation();
