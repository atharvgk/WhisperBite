import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config, validateConfig } from './config';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import chatRoutes from './routes/chat';
import bookingRoutes from './routes/bookings';
import authRoutes from './routes/auth';
import transcribeRoutes from './routes/transcribe';

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transcribe', transcribeRoutes);

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
    validateConfig();

    try {
        await mongoose.connect(config.mongodbUri);
        logger.info('Connected to MongoDB');
    } catch (error: any) {
        logger.error('MongoDB connection failed', { error: error.message });
        process.exit(1);
    }

    app.listen(config.port, () => {
        logger.info(`🚀 WhisperBite server running on port ${config.port}`);
        logger.info(`   Environment: ${config.nodeEnv}`);
        logger.info(`   Debug mode: ${config.debugMode}`);
    });
}

start();

export default app;
