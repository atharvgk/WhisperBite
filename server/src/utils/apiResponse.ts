import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
        success: true,
        data,
        error: null,
    } as ApiResponse<T>);
}

export function sendError(res: Response, error: string, statusCode: number = 500): void {
    res.status(statusCode).json({
        success: false,
        data: null,
        error,
    } as ApiResponse);
}
