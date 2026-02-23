import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: '120px 24px', maxWidth: '600px', margin: '0 auto' }}>
                <SkeletonLoader height="40px" count={3} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}
