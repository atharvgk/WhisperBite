import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { config } from '../config';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            sendError(res, 'Email and password are required', 400);
            return;
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

        if (!admin) {
            // Use same message for email not found and wrong password (security)
            sendError(res, 'Invalid email or password', 401);
            return;
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            sendError(res, 'Invalid email or password', 401);
            return;
        }

        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role,
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpiry }
        );

        logger.info(`Admin logged in: ${admin.email}`);

        sendSuccess(res, {
            token,
            admin: {
                email: admin.email,
                role: admin.role,
            },
            expiresIn: config.jwtExpiry,
        });
    } catch (error: any) {
        logger.error('Login error', { error: error.message });
        sendError(res, 'Login failed', 500);
    }
}

// POST /api/auth/verify — verify token is still valid
export async function verifyToken(req: Request, res: Response): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            sendError(res, 'No token provided', 401);
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as any;

        sendSuccess(res, {
            valid: true,
            admin: {
                email: decoded.email,
                role: decoded.role,
            },
        });
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            sendError(res, 'Token expired', 401);
            return;
        }
        sendError(res, 'Invalid token', 401);
    }
}
