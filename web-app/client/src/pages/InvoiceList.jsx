import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, DollarSign, Trash2, FileText, Inbox, Loader2 } from 'lucide-react';
import { invoiceAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/dateFormatter';
import { filterInvoicesByCreator, sortInvoices, getCreatorsFromInvoices } from '@/utils/invoiceUtils';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import CreatorFilter from '@/components/CreatorFilter';
import InvoiceSort from '@/components/InvoiceSort';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';

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
  const [allInvoices, setAllInvoices] = useState([]); // All fetched invoices
  const [loading, setLoading] = useState(true);
  
  // All filters are now client-side
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  
  // Client-side filters
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [sortOption, setSortOption] = useState(sessionStorage.getItem('sort_invoices') || 'created_desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Delete modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  
  // Clear filters when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('filter_invoices_creator');
    };
  }, []);

  // Load invoices once on mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      // Fetch all invoices - no server-side filtering
      const response = await invoiceAPI.getAll();
      // Backend returns array directly
      const invoiceData = Array.isArray(response.data) ? response.data : response.data.invoices || [];
      setAllInvoices(invoiceData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get creators list from fetched invoices
  const creators = useMemo(() => getCreatorsFromInvoices(allInvoices), [allInvoices]);
  
  // Apply ALL client-side filtering and sorting
  const processedInvoices = useMemo(() => {
    let filtered = [...allInvoices];
    
    // Apply search filter
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter(inv => 
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(search)) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(search))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    
    // Apply date range filters
    if (dateFromFilter) {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        const fromDate = new Date(dateFromFilter);
        return invDate >= fromDate;
      });
    }
    
    if (dateToFilter) {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        const toDate = new Date(dateToFilter);
        return invDate <= toDate;
      });
    }
    
    // Apply currency filter
    if (currencyFilter) {
      filtered = filtered.filter(inv => inv.currency === currencyFilter);
    }
    
    // Apply creator filter
    filtered = filterInvoicesByCreator(filtered, creatorFilter, user?.id);
    
    // Apply sorting
    let sorted = sortInvoices(filtered, sortOption);
    return sorted;
  }, [allInvoices, creatorFilter, sortOption, searchFilter, statusFilter, dateFromFilter, dateToFilter, currencyFilter, user]);
  
  const handleCreatorFilterChange = (filterValue) => {
    setCreatorFilter(filterValue);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleSortChange = (sortValue) => {
    setSortOption(sortValue);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handleSearchChange = (value) => {
    setSearchFilter(value);
    setCurrentPage(1);
  };
  
  const handleCurrencyChange = (value) => {
    setCurrencyFilter(value === 'ALL' ? '' : value);
    setCurrentPage(1);
  };
  
  const handleStatusChange = (value) => {
    setStatusFilter(value === 'ALL' ? '' : value);
    setCurrentPage(1);
  };
  
  const handleDateFromChange = (value) => {
    setDateFromFilter(value);
    setCurrentPage(1);
  };
  
  const handleDateToChange = (value) => {
    setDateToFilter(value);
    setCurrentPage(1);
  };

  // Pagination logic (applied to processed invoices)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = processedInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedInvoices.length / itemsPerPage);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
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
        <div className="flex items-center gap-3">
          <Select value={currencyFilter || "ALL"} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Currencies</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
          <CreatorFilter 
            creators={creators}
            onFilterChange={handleCreatorFilterChange}
            storageKey="filter_invoices_creator"
          />
          <InvoiceSort 
            onSortChange={handleSortChange}
            includeStatus={true}
            storageKey="sort_invoices"
          />
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search invoice or customer..."
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            
            <div>
              <Select value={statusFilter || "ALL"} onValueChange={handleStatusChange}>
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
            
            <div>
              <Select value={currencyFilter || "ALL"} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Currencies</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Label htmlFor="dateFrom" className="absolute -top-2 left-2 bg-background px-1 text-xs font-medium z-10">From</Label>
              <DatePicker
                value={dateFromFilter}
                onChange={handleDateFromChange}
                placeholder="From date"
              />
            </div>

            <div className="relative">
              <Label htmlFor="dateTo" className="absolute -top-2 left-2 bg-background px-1 text-xs font-medium z-10">To</Label>
              <DatePicker
                value={dateToFilter}
                onChange={handleDateToChange}
                placeholder="To date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Grid */}
      {processedInvoices.length === 0 ? (
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
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedInvoices.length)} of {processedInvoices.length} invoices
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
                            {(() => {
                              const getCurrencySymbol = (currency) => {
                                const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
                                return symbols[currency] || symbols['INR'];
                              };
                              return getCurrencySymbol(invoice.currency) + parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                            })()}
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
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {generatePageNumbers().map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
