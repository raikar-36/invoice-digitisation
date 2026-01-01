import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoiceAPI } from '../services/api';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const [invoiceRes, docsRes] = await Promise.all([
        invoiceAPI.getById(id),
        invoiceAPI.getDocuments(id).catch(() => ({ data: { documents: [] } }))
      ]);
      
      // Handle both response formats
      const invoiceData = invoiceRes.data.invoice || invoiceRes.data;
      setInvoice(invoiceData);
      
      const docs = docsRes.data?.documents || (Array.isArray(docsRes.data) ? docsRes.data : []);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Invoice {invoice.invoice_number}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Documents */}
          {documents.length > 0 && (
            <div className="lg:col-span-1">
              <div className="card sticky top-6">
                <h2 className="text-lg font-semibold mb-4">Documents</h2>
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={`/api/documents/${documents[currentDocIndex]?.document_id}`}
                    alt={`Document ${currentDocIndex + 1}`}
                    className="w-full h-auto"
                  />
                </div>
                {documents.length > 1 && (
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentDocIndex(Math.max(0, currentDocIndex - 1))}
                      disabled={currentDocIndex === 0}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentDocIndex + 1} of {documents.length}
                    </span>
                    <button
                      onClick={() => setCurrentDocIndex(Math.min(documents.length - 1, currentDocIndex + 1))}
                      disabled={currentDocIndex === documents.length - 1}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Column - Details */}
          <div className={documents.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg">₹{parseFloat(invoice.total_amount).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{invoice.status}</p>
                </div>
              </div>
            </div>

            {(invoice.customer_name || invoice.customer_email || invoice.customer_address || invoice.customer_gstin) && (
              <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  {invoice.customer_name && (
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{invoice.customer_name}</p>
                    </div>
                  )}
                  {invoice.customer_phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{invoice.customer_phone}</p>
                    </div>
                  )}
                  {invoice.customer_email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{invoice.customer_email}</p>
                    </div>
                  )}
                  {invoice.customer_gstin && (
                    <div>
                      <p className="text-sm text-gray-600">GSTIN</p>
                      <p className="font-semibold">{invoice.customer_gstin}</p>
                    </div>
                  )}
                  {invoice.customer_address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold">{invoice.customer_address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {invoice.items && invoice.items.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Line Items</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">{item.product_name || item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="text-right py-2 font-semibold">
                            ₹{parseFloat(item.line_total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceDetail;
