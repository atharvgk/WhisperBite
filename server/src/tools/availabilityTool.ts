import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { config } from '../config';
import logger from '../utils/logger';

export const availabilityTool = new DynamicStructuredTool({
    name: 'check_availability',
    description: 'Check if a specific date and time slot is available for booking. Returns availability status and alternative time slots if the requested slot is fully booked or near capacity.',
    schema: z.object({
        date: z.string().describe('The date to check, in YYYY-MM-DD format'),
        time: z.string().describe('The time to check, in HH:MM (24h) format'),
        guests: z.number().describe('Number of guests for the reservation'),
    }),
    func: async ({ date, time, guests }) => {
        logger.info(`Availability tool called: date=${date}, time=${time}, guests=${guests}`);

        try {
            // Count existing confirmed/pending guests for this slot
            const existingBookings = await Booking.find({
                bookingDate: date,
                bookingTime: time,
                status: { $in: ['pending', 'confirmed'] },
            });

            const currentGuestCount = existingBookings.reduce(
                (sum, b) => sum + b.numberOfGuests, 0
            );

            const remainingCapacity = config.maxGuestsPerSlot - currentGuestCount;
            const isAvailable = remainingCapacity >= guests;

            if (isAvailable) {
                const result = {
                    available: true,
                    date,
                    time,
                    requestedGuests: guests,
                    remainingCapacity,
                    message: `The slot on ${date} at ${time} is available with capacity for ${remainingCapacity} more guests.`,
                };
                logger.info('Availability check result', result);
                return JSON.stringify(result);
            }

            // Find alternative slots
            const timeSlots = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

            const alternatives: Array<{ time: string; remainingCapacity: number }> = [];

            for (const slot of timeSlots) {
                if (slot === time) continue;
                const slotBookings = await Booking.find({
                    bookingDate: date,
                    bookingTime: slot,
                    status: { $in: ['pending', 'confirmed'] },
                });
                const slotGuests = slotBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
                const slotCapacity = config.maxGuestsPerSlot - slotGuests;
                if (slotCapacity >= guests) {
                    alternatives.push({ time: slot, remainingCapacity: slotCapacity });
                }
                if (alternatives.length >= 3) break; // suggest up to 3 alternatives
            }

            const result = {
                available: false,
                date,
                time,
                requestedGuests: guests,
                currentCapacity: remainingCapacity,
                message: `Sorry, the slot on ${date} at ${time} cannot accommodate ${guests} guests (only ${Math.max(0, remainingCapacity)} spots remaining).`,
                alternativeSlots: alternatives.length > 0 ? alternatives : undefined,
                alternativeMessage: alternatives.length > 0
                    ? `Alternative available slots: ${alternatives.map(a => a.time).join(', ')}`
                    : 'No alternative slots available for this date. Please try another date.',
            };
            logger.info('Availability check result', result);
            return JSON.stringify(result);
        } catch (error: any) {
            logger.error(`Availability tool error: ${error.message}`);
            return JSON.stringify({
                available: false,
                error: 'Unable to check availability at the moment. Please try again.',
            });
        }
    },
});
