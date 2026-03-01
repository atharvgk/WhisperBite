import mongoose, { Schema, Document } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type SeatingPreference = 'indoor' | 'outdoor' | 'no preference';
export type CuisinePreference = 'Italian' | 'Chinese' | 'Indian' | 'Japanese' | 'Mexican' | 'Continental' | 'Other';

// Valid status transitions
const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
    cancelled: [], // terminal state
};

export interface IBooking extends Document {
    bookingId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    numberOfGuests: number;
    bookingDate: Date;
    bookingTime: string; // "7:00 PM" format
    cuisinePreference: CuisinePreference;
    specialRequests?: string;
    weatherInfo: {
        temperature: number | null;
        condition: string;
        description: string;
        icon: string;
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
            default: () => 'BK-' + Date.now(),
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        customerPhone: {
            type: String,
            trim: true,
        },
        customerEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        numberOfGuests: {
            type: Number,
            required: true,
            min: [1, 'Must have at least 1 guest'],
            max: [20, 'Maximum 20 guests per booking'],
        },
        bookingDate: {
            type: Date,
            required: true,
        },
        bookingTime: {
            type: String,
            required: true,
            // Expected format: "7:00 PM"
        },
        cuisinePreference: {
            type: String,
            required: true,
            enum: ['Italian', 'Chinese', 'Indian', 'Japanese', 'Mexican', 'Continental', 'Other'],
        },
        specialRequests: {
            type: String,
            default: '',
            trim: true,
        },
        weatherInfo: {
            temperature: { type: Number, default: null },
            condition: { type: String, default: 'unknown' },
            description: { type: String, default: '' },
            icon: { type: String, default: '' },
            seatingRecommendation: { type: String, default: 'indoor' },
        },
        seatingPreference: {
            type: String,
            enum: ['indoor', 'outdoor', 'no preference'],
            default: 'no preference',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'confirmed',
        },
    },
    {
        timestamps: true,
        optimisticConcurrency: true,
    }
);

// Compound index for availability checks
BookingSchema.index({ bookingDate: 1, bookingTime: 1 });

// Index for status-based queries
BookingSchema.index({ status: 1 });

// Index for customer name lookups (for double-booking detection)
BookingSchema.index({ customerName: 1, bookingDate: 1, bookingTime: 1 });

// Status transition validation
BookingSchema.methods.canTransitionTo = function (newStatus: BookingStatus): boolean {
    const currentStatus = this.status as BookingStatus;
    return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
};

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
