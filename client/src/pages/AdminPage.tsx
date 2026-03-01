import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BookingTable, { type Booking } from '../components/admin/BookingTable';
import Analytics from '../components/admin/Analytics';
import SkeletonLoader from '../components/shared/SkeletonLoader';
import { BarChart3, Table } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminPage() {
    const { token } = useAuth();
    const [tab, setTab] = useState('bookings');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchBookings = async () => {
        try {
            const params = new URLSearchParams({ page: String(page), limit: '10' });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            const res = await fetch(`${API_BASE}/bookings?${params}`, { headers });
            const data = await res.json();
            if (data.success) {
                setBookings(data.data.bookings);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (err) {
            toast.error('Failed to fetch bookings');
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_BASE}/bookings/analytics`, { headers });
            const data = await res.json();
            if (data.success) setAnalytics(data.data);
        } catch (err) {
            toast.error('Failed to fetch analytics');
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchBookings(), fetchAnalytics()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [page, search, statusFilter, dateFrom, dateTo]);

    const handleCancel = async (bookingId: string) => {
        try {
            const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers,
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Booking cancelled');
                fetchBookings();
                fetchAnalytics();
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error('Failed to cancel booking');
        }
    };

    const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Status updated to ${newStatus}`);
                fetchBookings();
                fetchAnalytics();
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleExportCsv = () => {
        const headerRow = ['Booking ID', 'Name', 'Guests', 'Date', 'Time', 'Cuisine', 'Seating', 'Status'];
        const rows = bookings.map(b =>
            [b.bookingId, b.customerName, b.numberOfGuests, b.bookingDate,
                b.bookingTime, b.cuisinePreference, b.seatingPreference ?? '', b.status]
                .map(v => `"${String(v).replace(/"/g, '""')}"`)
                .join(',')
        );
        const csv = [headerRow.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whisperbite-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="admin-page">
            <div className="admin-header container">
                <h1>Admin Dashboard</h1>
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${tab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setTab('bookings')}
                    >
                        <Table size={16} /> Bookings
                    </button>
                    <button
                        className={`admin-tab ${tab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setTab('analytics')}
                    >
                        <BarChart3 size={16} /> Analytics
                    </button>
                </div>
            </div>

            <div className="admin-content container">
                {loading ? (
                    <SkeletonLoader height="48px" count={6} />
                ) : tab === 'bookings' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <BookingTable
                            bookings={bookings}
                            search={search}
                            onSearchChange={v => { setSearch(v); setPage(1); }}
                            statusFilter={statusFilter}
                            onStatusFilterChange={v => { setStatusFilter(v); setPage(1); }}
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            onDateFromChange={v => { setDateFrom(v); setPage(1); }}
                            onDateToChange={v => { setDateTo(v); setPage(1); }}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            onCancel={handleCancel}
                            onStatusUpdate={handleStatusUpdate}
                            onExportCsv={handleExportCsv}
                        />
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Analytics data={analytics} />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
