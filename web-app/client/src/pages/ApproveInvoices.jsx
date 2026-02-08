import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { invoiceAPI } from '../services/api';
import { showToast } from '../utils/toast.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDate } from '../utils/dateFormatter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';

const ApproveInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [invoiceToApprove, setInvoiceToApprove] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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

  const handleApproveClick = (invoice) => {
    setInvoiceToApprove(invoice);
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!invoiceToApprove) return;
    
    try {
      setApproving(true);
      setError('');
      
      await invoiceAPI.approve(invoiceToApprove.id, {});
      
      // Refresh list
      await fetchPendingApprovalInvoices();
      
      showToast.success('Invoice approved successfully!');
      setShowApproveDialog(false);
      setInvoiceToApprove(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve invoice');
      showToast.error(err.response?.data?.error || 'Failed to approve invoice');
      console.error(err);
    } finally {
      setApproving(false);
    }
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
      setRejecting(true);
      setError('');
      
      await invoiceAPI.reject(selectedInvoice.id, { 
        reason: rejectionReason 
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
      setRejecting(false);
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
                      disabled={rejecting || approving}
                    >
                      {rejecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        'Reject'
                      )}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleApproveClick(invoice)}
                      disabled={rejecting || approving}
                    >
                      {approving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        'Approve →'
                      )}
                    </Button>
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
                disabled={rejecting}
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
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejecting || !rejectionReason.trim()}
            >
              {rejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold tracking-tight">
                Approve Invoice
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to approve invoice <strong className="font-mono">#{invoiceToApprove?.invoice_number}</strong> for <strong>₹{invoiceToApprove?.total_amount?.toLocaleString()}</strong>?
              <br />
              This action will finalize the invoice and it cannot be modified afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove}
              disabled={approving}
              className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
            >
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve Invoice'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-6 text-sm text-muted-foreground">
        <p><strong>Tip:</strong> Approved invoices will be saved to the database and marked as APPROVED.</p>
      </div>
    </div>
  );
};

export default ApproveInvoices;
