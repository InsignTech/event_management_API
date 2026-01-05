import cron from 'node-cron';
// import { sendWhatsAppReminder } from '../services/reminderService'; // Implement later

const initCronJobs = () => {
    // Schedule tasks
    // Example: Run every hour to check for upcoming events in 1 hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running hourly reminder job...');
        // logic to find events starting in 1 hour and send WA
    });
};

export default initCronJobs;
