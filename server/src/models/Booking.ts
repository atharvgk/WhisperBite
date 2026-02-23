import mongoose, { Schema, Document } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type SeatingPreference = 'indoor' | 'outdoor' | 'no_preference';

// Valid status transitions
const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
    cancelled: [], // terminal state
};

export interface IBooking extends Document {
    bookingId: string;
    customerName: string;
    numberOfGuests: number;
    bookingDate: string; // YYYY-MM-DD
    bookingTime: string; // HH:MM
    cuisinePreference: string;
    specialRequests: string;
    weatherInfo: {
        temperature: number | null;
        condition: string;
        seatingRecommendation: string;
    };
    seatingPreference: SeatingPreference;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
    canTransitionTo(newStatus: BookingStatus): boolean;
}

const BookingSchema = new Schema<IBooking>(
    {
        bookingId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        numberOfGuests: {
            type: Number,
            required: true,
            min: [1, 'Must have at least 1 guest'],
            max: [50, 'Maximum 50 guests per booking'],
        },
        bookingDate: {
            type: String,
            required: true,
        },
        bookingTime: {
            type: String,
            required: true,
        },
        cuisinePreference: {
            type: String,
            default: 'any',
            trim: true,
        },
        specialRequests: {
            type: String,
            default: '',
            trim: true,
        },
        weatherInfo: {
            temperature: { type: Number, default: null },
            condition: { type: String, default: 'unknown' },
            seatingRecommendation: { type: String, default: 'indoor' },
        },
        seatingPreference: {
            type: String,
            enum: ['indoor', 'outdoor', 'no_preference'],
            default: 'no_preference',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'confirmed',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for availability checks
BookingSchema.index({ bookingDate: 1, bookingTime: 1 });

// Index for status-based queries
BookingSchema.index({ status: 1 });

// Status transition validation
BookingSchema.methods.canTransitionTo = function (newStatus: BookingStatus): boolean {
    const currentStatus = this.status as BookingStatus;
    return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
};

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
