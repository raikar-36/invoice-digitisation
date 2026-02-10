import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileCheck, Loader2, Trash2, ArrowRight, Calendar, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { invoiceAPI } from '../services/api';
import { showToast } from '../utils/toast.jsx';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '@/contexts/AuthContext';
import { filterInvoicesByCreator, sortInvoices, getCreatorsFromInvoices } from '@/utils/invoiceUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import CreatorFilter from '@/components/CreatorFilter';
import InvoiceSort from '@/components/InvoiceSort';

const ReviewInvoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allInvoices, setAllInvoices] = useState([]); // All fetched invoices
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Client-side filters
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [sortOption, setSortOption] = useState(sessionStorage.getItem('sort_review') || 'created_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch all invoices once on mount
  useEffect(() => {
    fetchPendingReviewInvoices();
  }, []);
  
  // Clear filters when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('filter_review_creator');
    };
  }, []);

  const fetchPendingReviewInvoices = async () => {
    try {
      setLoading(true);
      // Fetch all invoices, filter client-side
      const response = await invoiceAPI.getAll();
      // Filter for PENDING_REVIEW status client-side
      const reviewInvoices = response.data.filter(inv => inv.status === 'PENDING_REVIEW');
      setAllInvoices(reviewInvoices);
    } catch (err) {
      setError('Failed to fetch invoices for review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Get creators list from fetched invoices
  const creators = useMemo(() => getCreatorsFromInvoices(allInvoices), [allInvoices]);
  
  // Apply client-side filtering and sorting
  const processedInvoices = useMemo(() => {
    let filtered = filterInvoicesByCreator(allInvoices, creatorFilter, user?.id);
    
    // Apply currency filter
    if (currencyFilter) {
      filtered = filtered.filter(inv => inv.currency === currencyFilter);
    }
    
    let sorted = sortInvoices(filtered, sortOption);
    return sorted;
  }, [allInvoices, creatorFilter, currencyFilter, sortOption, user]);
  
  const handleCreatorFilterChange = (filterValue) => {
    setCreatorFilter(filterValue);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleSortChange = (sortValue) => {
    setSortOption(sortValue);
    setCurrentPage(1); // Reset to first page when sort changes
  };
  
  const handleCurrencyChange = (value) => {
    setCurrencyFilter(value === 'ALL' ? '' : value);
    setCurrentPage(1);
  };

  const handleReviewClick = (invoiceId) => {
    navigate(`/dashboard/review/${invoiceId}`);
  };

  const handleDelete = async (invoice, e) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    
    try {
      setDeleting(true);
      await invoiceAPI.delete(invoiceToDelete.id);
      await fetchPendingReviewInvoices();
      showToast.success('Invoice deleted successfully');
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      showToast.error(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">Review Queue</h1>
            <p className="text-muted-foreground mt-2">
              Review and correct invoice data extracted by OCR before submitting for approval
            </p>
          </div>
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
              storageKey="filter_review_creator"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {processedInvoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <FileCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                No Invoices to Review
              </h3>
              <p className="text-sm text-muted-foreground">
                All uploaded invoices have been reviewed. Check the Invoices page to upload new ones.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedInvoices.length)} of {processedInvoices.length} invoices
            </div>
            <InvoiceSort 
              onSortChange={handleSortChange}
              storageKey="sort_review"
            />
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-7 gap-4">
            {currentInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={index === 0 ? 'col-span-7 md:col-span-4' : 'col-span-7 md:col-span-3'}
              >
                <Card
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleReviewClick(invoice.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                          <h3 className="text-lg font-semibold tracking-tight truncate">
                            {invoice.invoice_number || 'Not extracted'}
                          </h3>
                          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 flex-shrink-0">
                            PENDING REVIEW
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              <span>Invoice Date</span>
                            </div>
                            <p className="font-semibold tracking-tight">
                              {invoice.invoice_date 
                                ? formatDate(invoice.invoice_date)
                                : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Amount</span>
                            </div>
                            <p className="font-semibold font-mono tracking-tighter tabular-nums">
                              {(() => {
                                const getCurrencySymbol = (currency) => {
                                  const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
                                  return symbols[currency] || symbols['INR'];
                                };
                                return getCurrencySymbol(invoice.currency) + (invoice.total_amount?.toLocaleString() || '0.00');
                              })()}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Uploaded</span>
                            </div>
                            <p className="font-semibold tracking-tight">
                              {formatDate(invoice.created_at)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <FileText className="w-4 h-4" />
                              <span>Invoice #</span>
                            </div>
                            <p className="font-semibold font-mono tracking-tighter">
                              {invoice.invoice_number || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {invoice.rejection_reason && (
                          <div className="mt-3 p-2.5 bg-amber-500/5 border border-border/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                              <strong className="font-semibold">Rejection Reason:</strong> {invoice.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewClick(invoice.id);
                          }}
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          Review
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(invoice, e)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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

          <div className="mt-6 text-sm text-muted-foreground">
            <p><strong>Tip:</strong> Click on any invoice to review and correct the OCR-extracted data.</p>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold tracking-tight">
                Delete Invoice
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete invoice <strong className="font-mono">"{invoiceToDelete?.invoice_number || 'Untitled'}"</strong>? 
              This will remove all associated data and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Invoice'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewInvoices;
