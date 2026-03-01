import { Search, ChevronLeft, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import './BookingTable.css';

const STATUS_COLORS: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-success',
    cancelled: 'badge-error',
};

export interface Booking {
    bookingId: string;
    customerName: string;
    numberOfGuests: number;
    bookingDate: string;
    bookingTime: string;
    cuisinePreference: string;
    seatingPreference?: string;
    status: string;
}

interface Props {
    bookings: Booking[];
    search: string;
    onSearchChange: (v: string) => void;
    statusFilter: string;
    onStatusFilterChange: (v: string) => void;
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
    onCancel: (id: string) => void;
    onStatusUpdate: (id: string, status: string) => void;
}

export default function BookingTable({
    bookings,
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    page,
    totalPages,
    onPageChange,
    onCancel,
    onStatusUpdate,
}: Props) {
    return (
        <div className="booking-table-wrapper">
            {/* Filters */}
            <div className="table-filters">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search by name, ID, or cuisine..."
                        aria-label="Search bookings"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => onStatusFilterChange(e.target.value)}
                    className="status-filter"
                    aria-label="Filter by status"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            {bookings.length === 0 ? (
                <EmptyState
                    title="No bookings found"
                    description={search || statusFilter ? 'Try adjusting your filters' : 'Bookings will appear here once customers make reservations'}
                />
            ) : (
                <>
                    <div className="table-scroll">
                        <table className="booking-table" role="table">
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Name</th>
                                    <th>Guests</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Cuisine</th>
                                    <th>Seating</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b.bookingId}>
                                        <td className="id-cell">{b.bookingId}</td>
                                        <td>{b.customerName}</td>
                                        <td>{b.numberOfGuests}</td>
                                        <td>{b.bookingDate}</td>
                                        <td>{b.bookingTime}</td>
                                        <td>{b.cuisinePreference}</td>
                                        <td>{b.seatingPreference?.replace('_', ' ')}</td>
                                        <td>
                                            <span className={`badge ${STATUS_COLORS[b.status]}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            {b.status === 'pending' && (
                                                <button
                                                    className="action-btn confirm-btn"
                                                    onClick={() => onStatusUpdate(b.bookingId, 'confirmed')}
                                                    title="Confirm"
                                                    aria-label={`Confirm booking ${b.bookingId}`}
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}
                                            {b.status !== 'cancelled' && (
                                                <button
                                                    className="action-btn cancel-btn"
                                                    onClick={() => onCancel(b.bookingId)}
                                                    title="Cancel"
                                                    aria-label={`Cancel booking ${b.bookingId}`}
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => onPageChange(page - 1)}
                                disabled={page <= 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="page-info">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => onPageChange(page + 1)}
                                disabled={page >= totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
