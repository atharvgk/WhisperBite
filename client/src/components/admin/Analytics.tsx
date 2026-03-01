import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import EmptyState from '../shared/EmptyState';
import { BarChart3 } from 'lucide-react';
import './Analytics.css';

const COLORS = ['#6C63FF', '#FF6B6B', '#4ADE80', '#FBBF24', '#60A5FA', '#A78BFA', '#F472B6', '#34D399'];

interface AnalyticsData {
    overview?: { total: number; confirmed: number; cancelled: number; cancellationRate: number; avgPartySize?: number };
    peakHours?: Array<{ hour: string; bookings: number }>;
    cuisineDistribution?: Array<{ name: string; value: number }>;
    seatingDistribution?: Array<{ name: string; value: number }>;
    dailyTrend?: Array<{ date: string; confirmed: number; cancelled: number; total: number }>;
}

export interface Props { data: AnalyticsData | null; }

export default function Analytics({ data }: Props) {
    if (!data) return <EmptyState icon={BarChart3} title="No analytics data" description="Bookings data will appear here" />;

    return (
        <div className="analytics">
            {/* Overview Cards */}
            <div className="stat-cards">
                <div className="stat-card glass">
                    <span className="stat-label">Total Bookings</span>
                    <span className="stat-value">{data.overview?.total || 0}</span>
                </div>
                <div className="stat-card glass">
                    <span className="stat-label">Confirmed</span>
                    <span className="stat-value stat-success">{data.overview?.confirmed || 0}</span>
                </div>
                <div className="stat-card glass">
                    <span className="stat-label">Cancelled</span>
                    <span className="stat-value stat-error">{data.overview?.cancelled || 0}</span>
                </div>
                <div className="stat-card glass">
                    <span className="stat-label">Cancellation Rate</span>
                    <span className="stat-value">{data.overview?.cancellationRate || 0}%</span>
                </div>
            </div>

            <div className="charts-grid">
                {/* Peak Hours */}
                {(data.peakHours?.length ?? 0) > 0 && (
                    <div className="chart-box glass">
                        <h3>Peak Booking Hours</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.peakHours}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Bar dataKey="bookings" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Cuisine Distribution */}
                {(data.cuisineDistribution?.length ?? 0) > 0 && (
                    <div className="chart-box glass">
                        <h3>Cuisine Distribution</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data.cuisineDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {(data.cuisineDistribution ?? []).map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Seating Preferences */}
                {(data.seatingDistribution?.length ?? 0) > 0 && (
                    <div className="chart-box glass">
                        <h3>Seating Preferences</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.seatingDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Bar dataKey="value" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Daily Trend */}
                {(data.dailyTrend?.length ?? 0) > 0 && (
                    <div className="chart-box glass chart-wide">
                        <h3>Daily Booking Trend</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={data.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="confirmed" stroke="#4ADE80" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="cancelled" stroke="#F87171" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="total" stroke="#6C63FF" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
