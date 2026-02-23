import { Router } from 'express';
import {
    getAllBookings,
    getBookingById,
    deleteBooking,
    updateBookingStatus,
    checkAvailability,
    getAnalytics,
} from '../controllers/bookingController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// Public
router.get('/availability', checkAvailability);

// Admin-protected
router.get('/', requireAdmin, getAllBookings);
router.get('/analytics', requireAdmin, getAnalytics);
router.get('/:id', requireAdmin, getBookingById);
router.delete('/:id', requireAdmin, deleteBooking);
router.patch('/:id/status', requireAdmin, updateBookingStatus);

export default router;
