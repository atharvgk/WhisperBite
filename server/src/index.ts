import dns from 'dns';
// Force Google DNS — bypasses ISP DNS that can't resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

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

// Connect to MongoDB with retry logic
async function connectDB(retries = 0): Promise<void> {
    try {
        await mongoose.connect(config.mongodbUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4, // force IPv4 — fixes DNS SRV issues on some networks
        });
        logger.info('Connected to MongoDB');
    } catch (error: any) {
        logger.error('MongoDB connection failed', { error: error.message });
        const delay = Math.min(5000 * (retries + 1), 30000); // backoff up to 30s
        logger.info(`Retrying MongoDB connection in ${delay / 1000}s... (attempt ${retries + 1})`);
        setTimeout(() => connectDB(retries + 1), delay);
    }
}

// Start server
async function start() {
    validateConfig();

    // Start HTTP server immediately (don't block on DB)
    app.listen(config.port, () => {
        logger.info(`🚀 WhisperBite server running on port ${config.port}`);
        logger.info(`   Environment: ${config.nodeEnv}`);
        logger.info(`   Debug mode: ${config.debugMode}`);
    });

    // Connect to MongoDB in background with retries
    connectDB();
}

start();

export default app;
