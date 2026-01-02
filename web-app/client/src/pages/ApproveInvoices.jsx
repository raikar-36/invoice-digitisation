import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { invoiceAPI } from '../services/api';
import { showToast, confirmAction } from '../utils/toast.jsx';

const ApproveInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
        <p className="text-gray-600 mt-2">
          Review and approve invoices that have been submitted by staff
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-12"
        >
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Pending Approvals
          </h3>
          <p className="text-gray-600">
            All submitted invoices have been processed. Great job!
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {invoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-xl transition-all duration-200"
            >
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Invoice #{invoice.invoice_number}
                  </h3>
                  <span className="status-badge status-pending-approval">
                    PENDING APPROVAL
                  </span>
                </div>

                {/* Customer Info */}
                {invoice.customer_name && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium">{invoice.customer_name}</span>
                      </div>
                      {invoice.customer_phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 font-medium">{invoice.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Invoice Date:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium text-gray-900">
                      ₹{invoice.total_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tax:</span>
                    <p className="font-medium text-gray-900">
                      ₹{(invoice.tax_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <p className="font-medium text-gray-900">
                      {invoice.submitted_at 
                        ? new Date(invoice.submitted_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {invoice.submitted_by_name && (
                  <p className="text-sm text-gray-600 mb-4">
                    Submitted by: <strong>{invoice.submitted_by_name}</strong>
                  </p>
                )}

                {/* Line Items */}
                {invoice.items && invoice.items.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Line Items ({invoice.items.length})
                    </h4>
                    <div className="space-y-1 text-sm">
                      {invoice.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-gray-700">
                            {item.product_name || item.description} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            ₹{parseFloat(item.line_total).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {invoice.items.length > 3 && (
                        <div className="text-gray-500 text-xs pt-1">
                          + {invoice.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleViewDetails(invoice.id)}
                  className="btn-secondary flex-1"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleRejectClick(invoice)}
                  disabled={processing}
                  className="btn-danger flex-1"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(invoice)}
                  disabled={processing}
                  className="btn-primary flex-1"
                >
                  {processing ? 'Processing...' : 'Approve →'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Reject Invoice
              </h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Invoice: <strong>{selectedInvoice?.invoice_number}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Amount: <strong>₹{selectedInvoice?.total_amount?.toLocaleString()}</strong>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Explain why this invoice is being rejected..."
                  disabled={processing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The invoice will be returned to PENDING_REVIEW status
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={processing || !rejectionReason.trim()}
                  className="btn-danger flex-1"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Tip:</strong> Approved invoices will be saved to the database and marked as APPROVED.</p>
      </div>
    </div>
  );
};

export default ApproveInvoices;
