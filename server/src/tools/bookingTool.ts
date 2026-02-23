import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../models/Booking';
import logger from '../utils/logger';

export const bookingTool = new DynamicStructuredTool({
    name: 'create_booking',
    description: 'Create a new restaurant reservation. Only call this tool when ALL required fields have been confirmed by the customer: customerName, numberOfGuests, bookingDate, bookingTime. Returns the booking confirmation with a booking ID.',
    schema: z.object({
        customerName: z.string().describe('Full name of the customer'),
        numberOfGuests: z.number().min(1).describe('Number of guests'),
        bookingDate: z.string().describe('Reservation date in YYYY-MM-DD format'),
        bookingTime: z.string().describe('Reservation time in HH:MM (24h) format'),
        cuisinePreference: z.string().optional().describe('Preferred cuisine type (e.g., Italian, Japanese, Indian)'),
        specialRequests: z.string().optional().describe('Any special requests (dietary, occasion, etc.)'),
        seatingPreference: z.enum(['indoor', 'outdoor', 'no_preference']).optional().describe('Seating preference'),
        weatherInfo: z.object({
            temperature: z.number().nullable().optional(),
            condition: z.string().optional(),
            seatingRecommendation: z.string().optional(),
        }).optional().describe('Weather info from the weather tool'),
    }),
    func: async (input) => {
        logger.info('Booking tool called', { input });

        try {
            // Validate date is in the future
            const bookingDate = new Date(input.bookingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (bookingDate < today) {
                return JSON.stringify({
                    success: false,
                    error: 'Cannot book for a past date. Please provide a future date.',
                });
            }

            // Validate time format
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(input.bookingTime)) {
                return JSON.stringify({
                    success: false,
                    error: 'Invalid time format. Please use HH:MM (24-hour format).',
                });
            }

            const bookingId = `WB-${uuidv4().substring(0, 8).toUpperCase()}`;

            const booking = new Booking({
                bookingId,
                customerName: input.customerName,
                numberOfGuests: input.numberOfGuests,
                bookingDate: input.bookingDate,
                bookingTime: input.bookingTime,
                cuisinePreference: input.cuisinePreference || 'any',
                specialRequests: input.specialRequests || '',
                seatingPreference: input.seatingPreference || 'no_preference',
                weatherInfo: input.weatherInfo || {
                    temperature: null,
                    condition: 'unknown',
                    seatingRecommendation: 'indoor',
                },
                status: 'confirmed',
            });

            await booking.save();

            const result = {
                success: true,
                bookingId,
                message: `Reservation confirmed! Your booking ID is ${bookingId}.`,
                details: {
                    name: input.customerName,
                    guests: input.numberOfGuests,
                    date: input.bookingDate,
                    time: input.bookingTime,
                    cuisine: input.cuisinePreference || 'any',
                    seating: input.seatingPreference || 'no_preference',
                    specialRequests: input.specialRequests || 'none',
                },
            };

            logger.info('Booking created successfully', { bookingId });
            return JSON.stringify(result);
        } catch (error: any) {
            logger.error(`Booking tool error: ${error.message}`);
            return JSON.stringify({
                success: false,
                error: 'Failed to create booking. Please try again.',
            });
        }
    },
});

export const cancelBookingTool = new DynamicStructuredTool({
    name: 'cancel_booking',
    description: 'Cancel an existing restaurant reservation by booking ID. This performs a soft delete by setting status to cancelled.',
    schema: z.object({
        bookingId: z.string().describe('The booking ID to cancel (e.g., WB-XXXXXXXX)'),
    }),
    func: async ({ bookingId }) => {
        logger.info(`Cancel booking tool called: ${bookingId}`);

        try {
            const booking = await Booking.findOne({ bookingId });

            if (!booking) {
                return JSON.stringify({
                    success: false,
                    error: `No booking found with ID ${bookingId}. Please check the booking ID and try again.`,
                });
            }

            if (!booking.canTransitionTo('cancelled')) {
                return JSON.stringify({
                    success: false,
                    error: `Booking ${bookingId} is already ${booking.status} and cannot be cancelled.`,
                });
            }

            await Booking.findOneAndUpdate({ bookingId }, { $set: { status: 'cancelled' } });

            logger.info(`Booking cancelled: ${bookingId}`);
            return JSON.stringify({
                success: true,
                message: `Booking ${bookingId} has been cancelled successfully.`,
                bookingId,
            });
        } catch (error: any) {
            logger.error(`Cancel booking error: ${error.message}`);
            return JSON.stringify({
                success: false,
                error: 'Failed to cancel booking. Please try again.',
            });
        }
    },
});

export const updateBookingTool = new DynamicStructuredTool({
    name: 'update_booking',
    description: 'Update an existing reservation. Use this when the customer wants to change details like time, date, or number of guests.',
    schema: z.object({
        bookingId: z.string().describe('The booking ID to update'),
        numberOfGuests: z.number().optional().describe('Updated number of guests'),
        bookingDate: z.string().optional().describe('Updated date in YYYY-MM-DD format'),
        bookingTime: z.string().optional().describe('Updated time in HH:MM format'),
        cuisinePreference: z.string().optional().describe('Updated cuisine preference'),
        specialRequests: z.string().optional().describe('Updated special requests'),
        seatingPreference: z.enum(['indoor', 'outdoor', 'no_preference']).optional().describe('Updated seating preference'),
    }),
    func: async ({ bookingId, ...updates }) => {
        logger.info(`Update booking tool called: ${bookingId}`, { updates });

        try {
            const booking = await Booking.findOne({ bookingId });

            if (!booking) {
                return JSON.stringify({
                    success: false,
                    error: `No booking found with ID ${bookingId}.`,
                });
            }

            if (booking.status === 'cancelled') {
                return JSON.stringify({
                    success: false,
                    error: `Booking ${bookingId} is cancelled and cannot be updated.`,
                });
            }

            // Apply updates
            if (updates.numberOfGuests) booking.numberOfGuests = updates.numberOfGuests;
            if (updates.bookingDate) booking.bookingDate = updates.bookingDate;
            if (updates.bookingTime) booking.bookingTime = updates.bookingTime;
            if (updates.cuisinePreference) booking.cuisinePreference = updates.cuisinePreference;
            if (updates.specialRequests !== undefined) booking.specialRequests = updates.specialRequests;
            if (updates.seatingPreference) booking.seatingPreference = updates.seatingPreference;

            await booking.save();

            logger.info(`Booking updated: ${bookingId}`);
            return JSON.stringify({
                success: true,
                message: `Booking ${bookingId} has been updated successfully.`,
                updatedDetails: {
                    name: booking.customerName,
                    guests: booking.numberOfGuests,
                    date: booking.bookingDate,
                    time: booking.bookingTime,
                    cuisine: booking.cuisinePreference,
                    seating: booking.seatingPreference,
                },
            });
        } catch (error: any) {
            logger.error(`Update booking error: ${error.message}`);
            return JSON.stringify({
                success: false,
                error: 'Failed to update booking. Please try again.',
            });
        }
    },
});
