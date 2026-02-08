import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import UploadInvoice from './pages/UploadInvoice';
import InvoiceList from './pages/InvoiceList';
import InvoiceDetail from './pages/InvoiceDetail';
import ReviewInvoices from './pages/ReviewInvoices';
import ReviewInvoiceDetail from './pages/ReviewInvoiceDetail';
import ApproveInvoices from './pages/ApproveInvoices';
import Insights from './pages/Insights';
import UserManagement from './pages/UserManagement';
import AuditLog from './pages/AuditLog';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Common routes */}
        <Route index element={<InvoiceList />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        
        {/* Owner and Staff routes */}
        {(user.role === 'OWNER' || user.role === 'STAFF') ? (
          <>
            <Route path="upload" element={<UploadInvoice />} />
            <Route path="review" element={<ReviewInvoices />} />
            <Route path="review/:id" element={<ReviewInvoiceDetail />} />
          </>
        ) : null}
        
        {/* Owner only routes */}
        {user.role === 'OWNER' ? (
          <>
            <Route path="approve" element={<ApproveInvoices />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="audit" element={<AuditLog />} />
          </>
        ) : null}
        
        {/* Insights available to Owner and Accountant */}
        {(user.role === 'OWNER' || user.role === 'ACCOUNTANT') ? (
          <Route path="insights" element={<Insights />} />
        ) : null}
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
