import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
    }

    return children;
};

export default ProtectedRoute;

