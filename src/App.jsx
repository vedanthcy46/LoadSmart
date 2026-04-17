import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  // If no user is logged in, show login page
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Route based on user role
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      />
      {/* Redirect root to appropriate dashboard */}
      <Route
        path="/"
        element={<Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />}
      />
      {/* Catch all - redirect to appropriate dashboard */}
      <Route
        path="*"
        element={<Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
