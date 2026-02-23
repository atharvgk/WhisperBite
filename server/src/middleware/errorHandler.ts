import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { sendError } from '../utils/apiResponse';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    logger.error(`Unhandled error: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (err.name === 'ValidationError') {
        sendError(res, err.message, 400);
        return;
    }

    if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
        sendError(res, 'Authentication required', 401);
        return;
    }

    if (err.name === 'ForbiddenError' || err.message === 'Forbidden') {
        sendError(res, 'Access forbidden', 403);
        return;
    }

    sendError(res,
        process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        500
    );
}
