import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error';

import authRoutes from './routes/authRoutes';
import collegeRoutes from './routes/collegeRoutes';
import studentRoutes from './routes/studentRoutes';
import eventRoutes from './routes/eventRoutes';
import programRoutes from './routes/programRoutes';
import registrationRoutes from './routes/registrationRoutes';
import scoreRoutes from './routes/scoreRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/scores', scoreRoutes);

// Error Handler
app.use(errorHandler);

export default app;
