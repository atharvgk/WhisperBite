import { Router } from 'express';
import { login, verifyToken } from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, login);
router.get('/verify', verifyToken);

export default router;
