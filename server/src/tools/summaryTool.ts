import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../utils/logger';

export const summaryTool = new DynamicStructuredTool({
    name: 'format_booking_summary',
    description: 'Format a structured booking summary for the customer to review BEFORE confirming a reservation. IMPORTANT: Only call this tool when you have ALL required fields (customerName, numberOfGuests, bookingDate, bookingTime) with real values collected from the customer. Do NOT call this with placeholder or "Unknown" values.',
    schema: z.object({
        customerName: z.string().describe('Customer name — must be a real name from the customer'),
        numberOfGuests: z.union([z.number(), z.string()]).transform(val => {
            const n = typeof val === 'string' ? parseInt(val, 10) : val;
            return isNaN(n) ? 1 : n;
        }).describe('Number of guests — must be a real number from the customer'),
        bookingDate: z.string().describe('Booking date in YYYY-MM-DD format — must be a real date'),
        bookingTime: z.string().describe('Booking time in HH:MM format — must be a real time'),
        cuisinePreference: z.string().optional().describe('Cuisine preference if provided'),
        specialRequests: z.string().optional().describe('Special requests if any'),
        seatingPreference: z.string().optional().describe('Seating preference if specified'),
        weatherInfo: z.string().optional().describe('Weather summary if available from check_weather'),
    }),
    func: async (input) => {
        logger.info('Summary tool called', { input });

        const guests = typeof input.numberOfGuests === 'string'
            ? parseInt(input.numberOfGuests, 10) || 1
            : input.numberOfGuests;

        const summary = {
            title: '📋 Booking Summary',
            details: {
                '👤 Name': input.customerName,
                '👥 Guests': guests,
                '📅 Date': input.bookingDate,
                '🕐 Time': input.bookingTime,
                '🍽️ Cuisine': input.cuisinePreference || 'Any',
                '💺 Seating': input.seatingPreference || 'No preference',
                '📝 Special Requests': input.specialRequests || 'None',
            },
            weather: input.weatherInfo || null,
            confirmationPrompt: 'Would you like to confirm this reservation?',
        };

        return JSON.stringify(summary);
    },
});
