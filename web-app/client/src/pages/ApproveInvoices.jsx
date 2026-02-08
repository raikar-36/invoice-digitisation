import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, Eye } from 'lucide-react';
import { invoiceAPI } from '../services/api';
import { showToast, confirmAction } from '../utils/toast.jsx';
import { formatDate } from '../utils/dateFormatter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ApproveInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingApprovalInvoices();
  }, []);

  const fetchPendingApprovalInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceAPI.getAll({ status: 'PENDING_APPROVAL' });
      setInvoices(response.data);
    } catch (err) {
      setError('Failed to fetch invoices for approval');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoice) => {
    confirmAction(
      `Approve invoice ${invoice.invoice_number} for ₹${invoice.total_amount?.toLocaleString()}?`,
      async () => {
        try {
          setProcessing(true);
          setError('');
          
          await invoiceAPI.approve(invoice.id, {});
          
          // Refresh list
          await fetchPendingApprovalInvoices();
          
          showToast.success('Invoice approved successfully!');
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to approve invoice');
          showToast.error(err.response?.data?.error || 'Failed to approve invoice');
          console.error(err);
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleRejectClick = (invoice) => {
    setSelectedInvoice(invoice);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      showToast.warning('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      
      await invoiceAPI.reject(selectedInvoice.id, { 
        rejection_reason: rejectionReason 
      });
      
      // Refresh list
      await fetchPendingApprovalInvoices();
      
      setShowRejectModal(false);
      setSelectedInvoice(null);
      showToast.success('Invoice rejected and returned for review');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject invoice');
      showToast.error(err.response?.data?.error || 'Failed to reject invoice');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (invoiceId) => {
    navigate(`/dashboard/invoices/${invoiceId}`);
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
        <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve invoices that have been submitted by staff
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
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-xl font-semibold mb-2">
                No Pending Approvals
              </h3>
              <p className="text-sm text-muted-foreground">
                All submitted invoices have been processed. Great job!
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
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold">
                        Invoice #{invoice.invoice_number}
                      </h3>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                        PENDING APPROVAL
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    {invoice.customer_name && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Customer Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2 font-medium">{invoice.customer_name}</span>
                          </div>
                          {invoice.customer_phone && (
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="ml-2 font-medium">{invoice.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                      
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Invoice Date:</span>
                        <p className="font-medium">
                          {formatDate(invoice.invoice_date)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-medium font-mono tabular-nums">
                          ₹{invoice.total_amount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tax:</span>
                        <p className="font-medium font-mono tabular-nums">
                          ₹{(invoice.tax_amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <p className="font-medium">
                          {invoice.submitted_at 
                            ? formatDate(invoice.submitted_at)
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {invoice.submitted_by_name && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Submitted by: <strong>{invoice.submitted_by_name}</strong>
                      </p>
                    )}

                    {/* Line Items */}
                    {invoice.items && invoice.items.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">
                          Line Items ({invoice.items.length})
                        </h4>
                        <div className="space-y-1 text-sm">
                          {invoice.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {item.product_name || item.description} x {item.quantity}
                              </span>
                              <span className="font-medium font-mono tabular-nums">
                                ₹{parseFloat(item.line_total).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {invoice.items.length > 3 && (
                            <div className="text-muted-foreground text-xs pt-1">
                              + {invoice.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewDetails(invoice.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleRejectClick(invoice)}
                      disabled={processing}
                    >
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleApprove(invoice)}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Approve →'}
                    </Button>
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
      </>
      )}

      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Reject Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Invoice: <strong>{selectedInvoice?.invoice_number}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Amount: <strong className="font-mono tabular-nums">₹{selectedInvoice?.total_amount?.toLocaleString()}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="rejection-reason">
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Explain why this invoice is being rejected..."
                disabled={processing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The invoice will be returned to PENDING_REVIEW status
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6 text-sm text-muted-foreground">
        <p><strong>Tip:</strong> Approved invoices will be saved to the database and marked as APPROVED.</p>
      </div>
    </div>
  );
};

export default ApproveInvoices;
