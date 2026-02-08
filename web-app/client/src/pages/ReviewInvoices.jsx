import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileCheck, Loader2, Trash2, ArrowRight, Calendar, DollarSign, FileText } from 'lucide-react';
import { invoiceAPI } from '../services/api';
import { showToast, confirmAction } from '../utils/toast.jsx';
import { formatDate } from '../utils/dateFormatter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReviewInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingReviewInvoices();
  }, []);

  const fetchPendingReviewInvoices = async () => {
    try {
      setLoading(true);
      // Fetch invoices with PENDING_REVIEW status
      const response = await invoiceAPI.getAll({ status: 'PENDING_REVIEW' });
      setInvoices(response.data);
    } catch (err) {
      setError('Failed to fetch invoices for review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (invoiceId) => {
    navigate(`/dashboard/review/${invoiceId}`);
  };

  const handleDelete = async (invoiceId, invoiceNumber, e) => {
    e.stopPropagation();
    
    confirmAction(
      `Delete invoice "${invoiceNumber || 'Untitled'}"? This will remove all associated data and cannot be undone.`,
      async () => {
        try {
          await invoiceAPI.delete(invoiceId);
          // Refresh the list
          await fetchPendingReviewInvoices();
          showToast.success('Invoice deleted successfully');
        } catch (err) {
          console.error('Failed to delete invoice:', err);
          showToast.error(err.response?.data?.message || 'Failed to delete invoice');
        }
      }
    );
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
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
        <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review and correct invoice data extracted by OCR before submitting for approval
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
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
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, invoices.length)} of {invoices.length} invoices
          </div>

          <div className="grid gap-6">
            {currentInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => handleReviewClick(invoice.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <FileText className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                          <h3 className="text-xl font-semibold">
                            {invoice.invoice_number || 'Not extracted'}
                          </h3>
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            PENDING REVIEW
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
                              <Calendar className="w-4 h-4" />
                              <span>Invoice Date</span>
                            </div>
                            <p className="font-medium">
                              {invoice.invoice_date 
                                ? formatDate(invoice.invoice_date)
                                : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Amount</span>
                            </div>
                            <p className="font-medium font-mono tabular-nums">
                              ₹{invoice.total_amount?.toLocaleString() || '0.00'}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Uploaded</span>
                            </div>
                            <p className="font-medium">
                              {formatDate(invoice.created_at)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
                              <FileText className="w-4 h-4" />
                              <span>Documents</span>
                            </div>
                            <p className="font-medium">
                              {invoice.document_count || 0} file(s)
                            </p>
                          </div>
                        </div>

                        {invoice.rejection_reason && (
                          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-900 dark:text-amber-100">
                              <strong>Rejection Reason:</strong> {invoice.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex items-center gap-3">
                        <Button
                          variant="destructive"
                          onClick={(e) => handleDelete(invoice.id, invoice.invoice_number, e)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewClick(invoice.id);
                          }}
                        >
                          Review Now
                          <ArrowRight className="w-4 h-4 ml-2" />
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

          <div className="mt-6 text-sm text-muted-foreground">
            <p><strong>Tip:</strong> Click on any invoice to review and correct the OCR-extracted data.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewInvoices;
