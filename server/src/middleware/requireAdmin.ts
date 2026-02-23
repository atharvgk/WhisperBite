import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
    adminId?: string;
    adminEmail?: string;
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            sendError(res, 'Authentication required. Please provide a valid token.', 401);
            return;
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, config.jwtSecret) as {
            id: string;
            email: string;
            role: string;
        };

        if (decoded.role !== 'admin') {
            sendError(res, 'Admin access required', 403);
            return;
        }

        req.adminId = decoded.id;
        req.adminEmail = decoded.email;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            logger.warn('JWT token expired', { path: req.path });
            sendError(res, 'Token expired. Please login again.', 401);
            return;
        }
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Invalid JWT token', { path: req.path });
            sendError(res, 'Invalid token', 401);
            return;
        }
        logger.error('Auth middleware error', { error: error.message });
        sendError(res, 'Authentication failed', 401);
    }
}
