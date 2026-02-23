import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { config } from '../config';
import logger from '../utils/logger';

// GET /api/bookings
export async function getAllBookings(req: Request, res: Response): Promise<void> {
    try {
        const { status, search, page = '1', limit = '20', sortBy = 'createdAt', order = 'desc' } = req.query;

        const filter: any = {};
        if (status && typeof status === 'string' && ['pending', 'confirmed', 'cancelled'].includes(status)) {
            filter.status = status;
        }
        if (search && typeof search === 'string') {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { bookingId: { $regex: search, $options: 'i' } },
                { cuisinePreference: { $regex: search, $options: 'i' } },
            ];
        }

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'asc' ? 1 : -1;

        const [bookings, total] = await Promise.all([
            Booking.find(filter)
                .sort({ [sortBy as string]: sortOrder })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Booking.countDocuments(filter),
        ]);

        sendSuccess(res, {
            bookings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        logger.error('Get bookings error', { error: error.message });
        sendError(res, 'Failed to fetch bookings', 500);
    }
}

// GET /api/bookings/:id
export async function getBookingById(req: Request, res: Response): Promise<void> {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.id }).lean();

        if (!booking) {
            sendError(res, 'Booking not found', 404);
            return;
        }

        sendSuccess(res, booking);
    } catch (error: any) {
        logger.error('Get booking error', { error: error.message });
        sendError(res, 'Failed to fetch booking', 500);
    }
}

// DELETE /api/bookings/:id (soft delete — sets status to cancelled)
export async function deleteBooking(req: Request, res: Response): Promise<void> {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.id });

        if (!booking) {
            sendError(res, 'Booking not found', 404);
            return;
        }

        if (booking.status === 'cancelled') {
            sendError(res, 'Booking is already cancelled', 400);
            return;
        }

        const updated = await Booking.findOneAndUpdate(
            { bookingId: req.params.id },
            { $set: { status: 'cancelled' } },
            { new: true }
        );

        logger.info(`Booking cancelled: ${req.params.id}`);
        sendSuccess(res, { message: 'Booking cancelled successfully', bookingId: req.params.id, booking: updated });
    } catch (error: any) {
        logger.error('Delete booking error', { error: error.message, stack: error.stack });
        sendError(res, 'Failed to cancel booking', 500);
    }
}

// PATCH /api/bookings/:id/status
export async function updateBookingStatus(req: Request, res: Response): Promise<void> {
    try {
        const { status } = req.body;
        if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
            sendError(res, 'Invalid status. Must be one of: pending, confirmed, cancelled', 400);
            return;
        }

        const booking = await Booking.findOne({ bookingId: req.params.id });
        if (!booking) {
            sendError(res, 'Booking not found', 404);
            return;
        }

        if (!booking.canTransitionTo(status)) {
            sendError(res, `Cannot transition from ${booking.status} to ${status}`, 400);
            return;
        }

        const updated = await Booking.findOneAndUpdate(
            { bookingId: req.params.id },
            { $set: { status } },
            { new: true }
        );

        logger.info(`Booking status updated: ${req.params.id} → ${status}`);
        sendSuccess(res, { message: `Booking status updated to ${status}`, booking: updated });
    } catch (error: any) {
        logger.error('Update booking status error', { error: error.message, stack: error.stack });
        sendError(res, 'Failed to update booking status', 500);
    }
}

// GET /api/availability
export async function checkAvailability(req: Request, res: Response): Promise<void> {
    try {
        const { date, time, guests } = req.query;

        if (!date || !time) {
            sendError(res, 'Date and time are required', 400);
            return;
        }

        const guestCount = parseInt(guests as string, 10) || 2;

        const existingBookings = await Booking.find({
            bookingDate: date as string,
            bookingTime: time as string,
            status: { $in: ['pending', 'confirmed'] },
        });

        const currentGuestCount = existingBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
        const remainingCapacity = config.maxGuestsPerSlot - currentGuestCount;

        sendSuccess(res, {
            available: remainingCapacity >= guestCount,
            date,
            time,
            remainingCapacity: Math.max(0, remainingCapacity),
            maxCapacity: config.maxGuestsPerSlot,
        });
    } catch (error: any) {
        logger.error('Availability check error', { error: error.message });
        sendError(res, 'Failed to check availability', 500);
    }
}

// GET /api/bookings/analytics
export async function getAnalytics(req: Request, res: Response): Promise<void> {
    try {
        const [
            totalBookings,
            confirmedCount,
            cancelledCount,
            cuisineDistribution,
            seatingDistribution,
            hourlyDistribution,
            dailyBookings,
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.countDocuments({ status: 'cancelled' }),
            Booking.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: '$cuisinePreference', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            Booking.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: '$seatingPreference', count: { $sum: 1 } } },
            ]),
            Booking.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: { $substr: ['$bookingTime', 0, 2] },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Booking.aggregate([
                {
                    $group: {
                        _id: '$bookingDate',
                        total: { $sum: 1 },
                        confirmed: {
                            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
                        },
                        cancelled: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                        },
                    },
                },
                { $sort: { _id: -1 } },
                { $limit: 30 },
            ]),
        ]);

        sendSuccess(res, {
            overview: {
                total: totalBookings,
                confirmed: confirmedCount,
                cancelled: cancelledCount,
                cancellationRate: totalBookings > 0
                    ? Math.round((cancelledCount / totalBookings) * 100)
                    : 0,
            },
            cuisineDistribution: cuisineDistribution.map(c => ({
                name: c._id || 'any',
                value: c.count,
            })),
            seatingDistribution: seatingDistribution.map(s => ({
                name: s._id || 'no_preference',
                value: s.count,
            })),
            peakHours: hourlyDistribution.map(h => ({
                hour: `${h._id}:00`,
                bookings: h.count,
            })),
            dailyTrend: dailyBookings.map(d => ({
                date: d._id,
                total: d.total,
                confirmed: d.confirmed,
                cancelled: d.cancelled,
            })),
        });
    } catch (error: any) {
        logger.error('Analytics error', { error: error.message });
        sendError(res, 'Failed to fetch analytics', 500);
    }
}
