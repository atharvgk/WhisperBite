import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './BookingSummaryModal.css';

export interface BookingSummaryData {
    bookingId: string;
    customerName?: string;
    numberOfGuests?: number;
    bookingDate?: string;
    bookingTime?: string;
    cuisinePreference?: string;
    specialRequests?: string;
    seatingPreference?: string;
    weatherCondition?: string;
    weatherTemp?: number | null;
}

export interface Props {
    data: BookingSummaryData | null;
    onClose: () => void;
    onReset?: () => void;
}

export default function BookingSummaryModal({ data, onClose, onReset }: Props) {
    if (!data) return null;

    const copyDetails = () => {
        const details = [
            `Booking ID: ${data.bookingId}`,
            data.customerName ? `Name: ${data.customerName}` : '',
            data.numberOfGuests ? `Guests: ${data.numberOfGuests}` : '',
            data.bookingDate ? `Date: ${data.bookingDate}` : '',
            data.bookingTime ? `Time: ${data.bookingTime}` : '',
            data.cuisinePreference ? `Cuisine: ${data.cuisinePreference}` : '',
            data.seatingPreference ? `Seating: ${data.seatingPreference}` : '',
            data.specialRequests ? `Special Requests: ${data.specialRequests}` : '',
            data.weatherCondition ? `Weather: ${data.weatherCondition}${data.weatherTemp != null ? ` (${data.weatherTemp}°C)` : ''}` : '',
        ].filter(Boolean).join('\n');
        navigator.clipboard.writeText(details);
        toast.success('Booking details copied!');
    };

    const handleReset = () => {
        onClose();
        onReset?.();
    };

    const rows: Array<{ label: string; value: string | number | undefined }> = [
        { label: 'Name', value: data.customerName },
        { label: 'Guests', value: data.numberOfGuests },
        { label: 'Date', value: data.bookingDate },
        { label: 'Time', value: data.bookingTime },
        { label: 'Cuisine', value: data.cuisinePreference },
        { label: 'Seating', value: data.seatingPreference },
        { label: 'Special Requests', value: data.specialRequests || 'None' },
        { label: 'Weather', value: data.weatherCondition ? `${data.weatherCondition}${data.weatherTemp != null ? ` · ${data.weatherTemp}°C` : ''}` : undefined },
    ];

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="modal-card glass"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <X size={18} />
                    </button>

                    <div className="modal-icon">
                        <CheckCircle size={48} />
                    </div>

                    <h2>Reservation Confirmed!</h2>

                    <div className="booking-id" onClick={copyDetails} title="Click to copy all details">
                        <span>{data.bookingId}</span>
                        <Copy size={14} />
                    </div>

                    <div className="modal-details">
                        {rows.map(({ label, value }) =>
                            value !== undefined && value !== '' ? (
                                <div className="modal-row" key={label}>
                                    <span className="modal-label">{label}</span>
                                    <span>{value}</span>
                                </div>
                            ) : null
                        )}
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary modal-copy" onClick={copyDetails}>
                            <Copy size={14} /> Copy Details
                        </button>
                        <button className="btn-primary modal-done" onClick={onClose}>
                            Done
                        </button>
                    </div>

                    {onReset && (
                        <button className="modal-reset-btn" onClick={handleReset}>
                            <RefreshCw size={14} /> Book Another Table
                        </button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
