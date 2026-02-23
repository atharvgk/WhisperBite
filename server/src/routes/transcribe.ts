import { Router } from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import { config } from '../config';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const groq = new Groq({ apiKey: config.groqApiKey, timeout: 60000 });

router.post('/', upload.single('audio'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return sendError(res, 'No audio file provided', 400);
        }

        logger.debug(`Transcribing audio: ${req.file.size} bytes, type: ${req.file.mimetype}`);

        // Create a File-like object from the buffer
        const audioFile = new File(
            [req.file.buffer],
            'audio.webm',
            { type: req.file.mimetype || 'audio/webm' }
        );

        const transcription: any = await groq.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-large-v3',
            language: 'en',
            response_format: 'text',
        });

        const text = typeof transcription === 'string'
            ? transcription.trim()
            : transcription?.text?.trim() || '';

        if (!text) {
            return sendError(res, 'No speech detected in audio', 400);
        }

        logger.debug(`Transcription result: "${text}"`);
        return sendSuccess(res, { text });
    } catch (err: any) {
        logger.error('Transcription error:', err);
        return sendError(res, 'Failed to transcribe audio. Please try again.', 500);
    }
});

export default router;
