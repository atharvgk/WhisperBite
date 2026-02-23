import { Request, Response } from 'express';
import { invokeAgent } from '../agents/reservationAgent';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export async function handleChat(req: Request, res: Response): Promise<void> {
    try {
        const { message, sessionId } = req.body;

        if (!message || typeof message !== 'string') {
            sendError(res, 'Message is required and must be a string', 400);
            return;
        }

        if (!sessionId || typeof sessionId !== 'string') {
            sendError(res, 'Session ID is required', 400);
            return;
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length === 0) {
            sendError(res, 'Message cannot be empty', 400);
            return;
        }

        if (trimmedMessage.length > 2000) {
            sendError(res, 'Message too long. Maximum 2000 characters.', 400);
            return;
        }

        logger.info(`Chat request: session=${sessionId}, message="${trimmedMessage.substring(0, 100)}..."`);

        const response = await invokeAgent(sessionId, trimmedMessage);

        sendSuccess(res, {
            message: response,
            sessionId,
        });
    } catch (error: any) {
        logger.error('Chat controller error', { error: error.message });
        sendError(res, 'Failed to process your message. Please try again.', 500);
    }
}
