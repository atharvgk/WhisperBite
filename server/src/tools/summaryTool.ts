import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import logger from '../utils/logger';

/**
 * summaryTool — fetches a booking from DB by bookingId and returns a formatted confirmation string.
 * This is called AFTER create_booking succeeds to give the user a clean readable summary.
 */
export const summaryTool = new DynamicStructuredTool({
    name: 'get_booking_summary',
    description: 'Fetch a confirmed booking from the database by bookingId and return a formatted human-readable confirmation. Call this after create_booking succeeds to show the user their full booking details.',
    schema: z.object({
        bookingId: z.string().describe('The booking ID returned from create_booking (e.g., BK-1234567890)'),
    }),
    func: async ({ bookingId }) => {
        logger.info(`Summary tool called for bookingId: ${bookingId}`);

        try {
            const booking = await Booking.findOne({ bookingId }).lean();

            if (!booking) {
                return JSON.stringify({
                    success: false,
                    error: `No booking found with ID ${bookingId}. The booking may not have been saved yet.`,
                });
            }

            const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });

            const summary = [
                `✅ Booking Confirmed!`,
                `📋 Booking ID: ${booking.bookingId}`,
                `👤 Name: ${booking.customerName}`,
                `📅 Date: ${formattedDate}`,
                `🕐 Time: ${booking.bookingTime}`,
                `👥 Guests: ${booking.numberOfGuests}`,
                `🍽️ Cuisine: ${booking.cuisinePreference}`,
                `💺 Seating: ${booking.seatingPreference}`,
                booking.specialRequests ? `📝 Special Requests: ${booking.specialRequests}` : '',
                booking.weatherInfo?.condition && booking.weatherInfo.condition !== 'unknown'
                    ? `🌤️ Weather: ${booking.weatherInfo.condition} · ${booking.weatherInfo.temperature !== null ? `${booking.weatherInfo.temperature}°C` : 'N/A'} — ${booking.weatherInfo.seatingRecommendation}`
                    : '',
                `\nWe look forward to welcoming you at WhisperBite, Mumbai! 🍽️`,
            ].filter(Boolean).join('\n');

            logger.info(`Summary generated for ${bookingId}`);
            return JSON.stringify({
                success: true,
                bookingId: booking.bookingId,
                summary,
            });
        } catch (error: any) {
            logger.error(`Summary tool error: ${error.message}`);
            return JSON.stringify({
                success: false,
                error: 'Failed to fetch booking summary. Please provide the booking ID to the customer.',
            });
        }
    },
});
