import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import logger from '../utils/logger';

/**
 * Converts a 24h time string "HH:MM" or natural time "7:00 PM" to "h:mm a" format.
 * If already in 12h format, returns as-is after normalizing.
 */
function normalizeBookingTime(input: string): string {
    // Already in 12h format (contains AM/PM)
    if (/am|pm/i.test(input)) {
        return input.trim();
    }
    // 24h format
    const match = input.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hours = parseInt(match[1]);
        const minutes = match[2];
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes} ${period}`;
    }
    return input;
}

export const bookingTool = new DynamicStructuredTool({
    name: 'create_booking',
    description: 'Create a new restaurant reservation. Only call this tool when ALL required fields have been confirmed by the customer: customerName, numberOfGuests, bookingDate, bookingTime, cuisinePreference. Returns the booking confirmation with a booking ID.',
    schema: z.object({
        customerName: z.string().describe('Full name of the customer'),
        numberOfGuests: z.number().min(1).max(20).describe('Number of guests (max 20)'),
        bookingDate: z.string().describe('Reservation date in YYYY-MM-DD format'),
        bookingTime: z.string().describe('Reservation time, e.g. "7:00 PM" or "19:00"'),
        cuisinePreference: z.enum(['Italian', 'Chinese', 'Indian', 'Japanese', 'Mexican', 'Continental', 'Other']).describe('Preferred cuisine type'),
        specialRequests: z.string().optional().describe('Any special requests (dietary, occasion, etc.)'),
        seatingPreference: z.enum(['indoor', 'outdoor', 'no preference']).optional().describe('Seating preference'),
        weatherInfo: z.object({
            temperature: z.number().nullable().optional(),
            condition: z.string().optional(),
            description: z.string().optional(),
            icon: z.string().optional(),
            seatingRecommendation: z.string().optional(),
        }).optional().describe('Weather info from the check_weather tool'),
    }),
    func: async (input) => {
        logger.info('Booking tool called', { input });

        try {
            // Convert date string to Date object
            const bookingDate = new Date(input.bookingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (bookingDate < today) {
                return JSON.stringify({
                    success: false,
                    error: 'Cannot book for a past date. Please provide a future date.',
                });
            }

            // Normalize time to "7:00 PM" format
            const bookingTime = normalizeBookingTime(input.bookingTime);

            // Generate booking ID
            const bookingId = 'BK-' + Date.now();

            const booking = new Booking({
                bookingId,
                customerName: input.customerName.trim(),
                numberOfGuests: input.numberOfGuests,
                bookingDate,
                bookingTime,
                cuisinePreference: input.cuisinePreference,
                specialRequests: input.specialRequests || '',
                seatingPreference: input.seatingPreference || 'no preference',
                weatherInfo: {
                    temperature: input.weatherInfo?.temperature ?? null,
                    condition: input.weatherInfo?.condition ?? 'unknown',
                    description: input.weatherInfo?.description ?? '',
                    icon: input.weatherInfo?.icon ?? '',
                    seatingRecommendation: input.weatherInfo?.seatingRecommendation ?? 'indoor',
                },
                status: 'confirmed',
            });

            await booking.save();

            const formattedDate = bookingDate.toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });

            const result = {
                success: true,
                bookingId,
                message: `✅ Booking Confirmed! ID: ${bookingId} | Name: ${input.customerName} | Date: ${formattedDate} | Time: ${bookingTime} | Guests: ${input.numberOfGuests} | Cuisine: ${input.cuisinePreference} | Seating: ${input.seatingPreference || 'no preference'}`,
                details: {
                    name: input.customerName,
                    guests: input.numberOfGuests,
                    date: formattedDate,
                    time: bookingTime,
                    cuisine: input.cuisinePreference,
                    seating: input.seatingPreference || 'no preference',
                    specialRequests: input.specialRequests || 'none',
                },
            };

            logger.info('Booking created successfully', { bookingId });
            return JSON.stringify(result);
        } catch (error: any) {
            logger.error(`Booking tool error: ${error.message}`);
            if (error.code === 11000) {
                return JSON.stringify({
                    success: false,
                    error: 'A booking with that ID already exists. Please try again.',
                });
            }
            return JSON.stringify({
                success: false,
                error: 'Failed to create booking. Please try again.',
            });
        }
    },
});

export const cancelBookingTool = new DynamicStructuredTool({
    name: 'cancel_booking',
    description: 'Cancel an existing restaurant reservation by booking ID.',
    schema: z.object({
        bookingId: z.string().describe('The booking ID to cancel (e.g., BK-1234567890)'),
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
        bookingTime: z.string().optional().describe('Updated time (e.g. "7:00 PM")'),
        cuisinePreference: z.enum(['Italian', 'Chinese', 'Indian', 'Japanese', 'Mexican', 'Continental', 'Other']).optional(),
        specialRequests: z.string().optional().describe('Updated special requests'),
        seatingPreference: z.enum(['indoor', 'outdoor', 'no preference']).optional(),
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

            if (updates.numberOfGuests) booking.numberOfGuests = updates.numberOfGuests;
            if (updates.bookingDate) booking.bookingDate = new Date(updates.bookingDate);
            if (updates.bookingTime) booking.bookingTime = normalizeBookingTime(updates.bookingTime);
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
