import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, admin = false }) {
  const { user, isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">Checking your session…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (admin && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
