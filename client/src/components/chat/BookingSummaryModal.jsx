import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import './BookingSummaryModal.css';

export default function BookingSummaryModal({ data, onClose }) {
    if (!data) return null;

    const copyId = () => {
        navigator.clipboard.writeText(data.bookingId);
        toast.success('Booking ID copied!');
    };

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
                    onClick={e => e.stopPropagation()}
                >
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <X size={18} />
                    </button>

                    <div className="modal-icon">
                        <CheckCircle size={48} />
                    </div>

                    <h2>Reservation Confirmed!</h2>

                    <div className="booking-id" onClick={copyId} title="Click to copy">
                        <span>{data.bookingId}</span>
                        <Copy size={14} />
                    </div>

                    <div className="modal-details">
                        {data.customerName && (
                            <div className="modal-row">
                                <span className="modal-label">Name</span>
                                <span>{data.customerName}</span>
                            </div>
                        )}
                        {data.numberOfGuests > 0 && (
                            <div className="modal-row">
                                <span className="modal-label">Guests</span>
                                <span>{data.numberOfGuests}</span>
                            </div>
                        )}
                        {data.bookingDate && (
                            <div className="modal-row">
                                <span className="modal-label">Date</span>
                                <span>{data.bookingDate}</span>
                            </div>
                        )}
                        {data.bookingTime && (
                            <div className="modal-row">
                                <span className="modal-label">Time</span>
                                <span>{data.bookingTime}</span>
                            </div>
                        )}
                    </div>

                    <button className="btn-primary modal-done" onClick={onClose}>
                        Done
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
