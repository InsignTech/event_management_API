import app from './app';
import { connectDB } from './config/db';
import { env } from './utils/env';

const startServer = async () => {
    await connectDB();

    const PORT = env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
