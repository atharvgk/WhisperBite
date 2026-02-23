import winston from 'winston';
import { config } from '../config';

const logger = winston.createLogger({
    level: config.debugMode ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
            if (Object.keys(meta).length > 0) {
                log += ` ${JSON.stringify(meta)}`;
            }
            if (stack) {
                log += `\n${stack}`;
            }
            return log;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                    let log = `${timestamp} [${level}] ${message}`;
                    if (Object.keys(meta).length > 0) {
                        log += ` ${JSON.stringify(meta)}`;
                    }
                    if (stack) {
                        log += `\n${stack}`;
                    }
                    return log;
                })
            ),
        }),
    ],
});

if (config.nodeEnv === 'production') {
    logger.add(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    );
    logger.add(
        new winston.transports.File({ filename: 'logs/combined.log' })
    );
}

export default logger;
