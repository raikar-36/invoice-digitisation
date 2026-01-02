import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoiceAPI } from '../services/api';
import { showToast, confirmAction } from '../utils/toast.jsx';

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
        <div className="text-xl text-gray-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-600 mt-2">
          Review and correct invoice data extracted by OCR before submitting for approval
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
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Invoices to Review
          </h3>
          <p className="text-gray-600">
            All uploaded invoices have been reviewed. Check the Invoices page to upload new ones.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, invoices.length)} of {invoices.length} invoices
          </div>

          <div className="grid gap-6">
            {currentInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => handleReviewClick(invoice.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {invoice.invoice_number || 'Not extracted'}
                      </h3>
                      <span className="status-badge status-pending-review">
                        PENDING REVIEW
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Invoice Date:</span>
                        <p className="font-medium text-gray-900">
                          {invoice.invoice_date 
                            ? new Date(invoice.invoice_date).toLocaleDateString()
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p className="font-medium text-gray-900">
                          ₹{invoice.total_amount?.toLocaleString() || '0.00'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Uploaded:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Documents:</span>
                        <p className="font-medium text-gray-900">
                          {invoice.document_count || 0} file(s)
                        </p>
                      </div>
                    </div>

                    {invoice.rejection_reason && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-sm text-amber-800">
                          <strong>Rejection Reason:</strong> {invoice.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => handleDelete(invoice.id, invoice.invoice_number, e)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete Invoice"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewClick(invoice.id);
                        }}
                        className="btn-primary"
                      >
                        Review Now →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Tip:</strong> Click on any invoice to review and correct the OCR-extracted data.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewInvoices;
