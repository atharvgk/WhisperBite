import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Convert 12h time string "7:00 PM" to a comparable hour for ± range checks.
 */
function timeToHour(time: string): number {
    if (/am|pm/i.test(time)) {
        const [timePart, period] = time.split(/\s+/);
        const [h, m] = timePart.split(':').map(Number);
        let hour = period.toUpperCase() === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
        return hour + (m || 0) / 60;
    }
    const [h, m] = time.split(':').map(Number);
    return h + (m || 0) / 60;
}

/** Convert a 24h hour integer back to "h:mm AM/PM" format */
function hourToTime12(h: number): string {
    const mins = Math.round((h % 1) * 60);
    const wholeH = Math.floor(h);
    const period = wholeH >= 12 ? 'PM' : 'AM';
    const displayH = wholeH % 12 || 12;
    return `${displayH}:${mins.toString().padStart(2, '0')} ${period}`;
}

// Available reservation slots (12h format)
const AVAILABLE_SLOTS = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM',
];

export const availabilityTool = new DynamicStructuredTool({
    name: 'check_availability',
    description: 'Check if a specific date and time slot is available for booking, and detect double-booking for the same customer. Returns availability status and alternative time slots if the requested slot is fully booked.',
    schema: z.object({
        date: z.string().describe('The date to check, in YYYY-MM-DD format'),
        time: z.string().describe('The time to check, e.g. "7:00 PM" or "19:00"'),
        guests: z.number().describe('Number of guests for the reservation'),
        customerName: z.string().optional().describe('Customer name for double-booking detection'),
    }),
    func: async ({ date, time, guests, customerName }) => {
        logger.info(`Availability tool called: date=${date}, time=${time}, guests=${guests}, customer=${customerName}`);

        try {
            const bookingDateObj = new Date(date);

            // ── Double-booking detection ──────────────────────────────────────
            if (customerName) {
                const nameRegex = new RegExp(customerName.trim(), 'i');
                const existing = await Booking.findOne({
                    customerName: nameRegex,
                    bookingDate: bookingDateObj,
                    bookingTime: time,
                    status: { $in: ['pending', 'confirmed'] },
                });

                if (existing) {
                    return JSON.stringify({
                        available: false,
                        alreadyBooked: true,
                        existingBookingId: existing.bookingId,
                        message: `${customerName} already has a booking on ${date} at ${time} (ID: ${existing.bookingId}). Would you like to modify the existing booking instead?`,
                    });
                }
            }

            // ── Capacity check for requested slot ────────────────────────────
            const existingBookings = await Booking.find({
                bookingDate: bookingDateObj,
                bookingTime: time,
                status: { $in: ['pending', 'confirmed'] },
            });

            const currentGuestCount = existingBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
            const remainingCapacity = config.maxGuestsPerSlot - currentGuestCount;
            const isAvailable = remainingCapacity >= guests;

            if (isAvailable) {
                return JSON.stringify({
                    available: true,
                    date,
                    time,
                    requestedGuests: guests,
                    remainingCapacity,
                    message: `The slot on ${date} at ${time} is available with capacity for ${remainingCapacity} more guests.`,
                });
            }

            // ── Find ±2hr alternative slots ───────────────────────────────────
            const requestedHour = timeToHour(time);
            const alternatives: string[] = [];

            for (const slot of AVAILABLE_SLOTS) {
                if (slot === time) continue;
                const slotHour = timeToHour(slot);
                if (Math.abs(slotHour - requestedHour) > 2) continue; // ±2h window

                const slotBookings = await Booking.find({
                    bookingDate: bookingDateObj,
                    bookingTime: slot,
                    status: { $in: ['pending', 'confirmed'] },
                });
                const slotGuests = slotBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
                const slotCapacity = config.maxGuestsPerSlot - slotGuests;

                if (slotCapacity >= guests) {
                    alternatives.push(slot);
                }
                if (alternatives.length >= 3) break;
            }

            return JSON.stringify({
                available: false,
                date,
                time,
                requestedGuests: guests,
                currentCapacity: Math.max(0, remainingCapacity),
                message: `Sorry, the slot on ${date} at ${time} cannot accommodate ${guests} guests (only ${Math.max(0, remainingCapacity)} spots remaining).`,
                alternatives,
                alternativeMessage: alternatives.length > 0
                    ? `Available nearby slots: ${alternatives.join(', ')}. Would you prefer one of these?`
                    : 'No alternative slots available within 2 hours. Please try a different date.',
            });
        } catch (error: any) {
            logger.error(`Availability tool error: ${error.message}`);
            return JSON.stringify({
                available: false,
                error: 'Unable to check availability at the moment. Please try again.',
            });
        }
    },
});
