import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, DollarSign, Trash2, FileText, Inbox, Loader2 } from 'lucide-react';
import { invoiceAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showToast, confirmAction } from '../utils/toast';
import { formatDate } from '../utils/dateFormatter';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING_REVIEW: {
      label: 'Pending Review',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    },
    PENDING_APPROVAL: {
      label: 'Pending Approval',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    },
    APPROVED: {
      label: 'Approved',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    },
    REJECTED: {
      label: 'Rejected',
      className: 'bg-rose-100 text-rose-700 hover:bg-rose-100/80 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
    }
  };

  const config = statusConfig[status] || statusConfig.PENDING_REVIEW;

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

const InvoiceList = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Delete modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [filters]);

  const loadInvoices = async () => {
    try {
      const response = await invoiceAPI.getAll(filters);
      // Backend returns array directly
      const invoiceData = Array.isArray(response.data) ? response.data : response.data.invoices || [];
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
const handleDeleteClick = (e, invoice) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setShowPasswordModal(true);
  };

  const handleDeleteConfirm = async (password) => {
    try {
      // Verify password first
      await authAPI.verifyPassword(password);
      
      // Password verified, now delete
      await invoiceAPI.delete(invoiceToDelete.id);
      
      showToast.success('Invoice deleted successfully');
      
      // Reload invoices
      await loadInvoices();
      
      // Reset pagination if needed
      if (currentInvoices.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">Invoices</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search invoice or customer..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <Select value={filters.status || "ALL"} onValueChange={(value) => handleFilterChange('status', value === "ALL" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Label htmlFor="dateFrom" className="absolute -top-2 left-2 bg-background px-1 text-xs font-medium z-10">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="relative">
              <Label htmlFor="dateTo" className="absolute -top-2 left-2 bg-background px-1 text-xs font-medium z-10">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Grid */}
      {invoices.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or upload a new invoice</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, invoices.length)} of {invoices.length} invoices
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentInvoices.map((invoice, index) => (
              <Link key={invoice.id} to={`/dashboard/invoices/${invoice.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <h3 className="text-lg font-bold">
                              {invoice.invoice_number}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(invoice.invoice_date)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={invoice.status} />
                      </div>

                      <div className="space-y-3 mb-4">
                        {invoice.customer_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{invoice.customer_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                          <span className="text-lg font-bold font-mono tabular-nums">
                            ₹{parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          by {invoice.created_by_name}
                        </div>
                        
                        {user?.role === 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteClick(e, invoice)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              <span className="font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      {/* Password Confirmation Modal */}
      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoiceToDelete?.invoice_number}? This action cannot be undone. Please enter your password to confirm.`}
      />
    </div>
  );
};

export default InvoiceList;
