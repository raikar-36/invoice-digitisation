import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoiceAPI } from '../services/api';

const ReviewInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: '',
    total_amount: '',
    tax_amount: '',
    discount_amount: '',
    currency: 'INR',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_gstin: '',
    customer_address: '',
    items: []
  });

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const [invoiceRes, ocrRes, docsRes] = await Promise.all([
        invoiceAPI.getById(id),
        invoiceAPI.getOcrData(id).catch(() => ({ data: null })),
        invoiceAPI.getDocuments(id).catch(() => ({ data: { documents: [] } }))
      ]);

      setInvoice(invoiceRes.data);
      setOcrData(ocrRes.data);
      
      // Extract documents array properly
      const docs = docsRes.data?.documents || (Array.isArray(docsRes.data) ? docsRes.data : []);
      setDocuments(docs);

      // Pre-fill form with invoice data or OCR data
      const inv = invoiceRes.data;
      const ocr = ocrRes.data?.normalized_ocr_json;

      // Helper to format date for input field (yyyy-mm-dd)
      const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setFormData({
        invoice_number: inv.invoice_number || ocr?.invoice?.invoice_number || '',
        invoice_date: formatDateForInput(inv.invoice_date || ocr?.invoice?.invoice_date),
        total_amount: inv.total_amount || ocr?.invoice?.total_amount || '',
        tax_amount: inv.tax_amount || ocr?.invoice?.tax_amount || '',
        discount_amount: inv.discount_amount || ocr?.invoice?.discount_amount || '',
        currency: inv.currency || ocr?.invoice?.currency || 'INR',
        customer_name: ocr?.customer?.name || '',
        customer_phone: ocr?.customer?.phone || '',
        customer_email: ocr?.customer?.email || '',
        customer_gstin: ocr?.customer?.gstin || '',
        customer_address: ocr?.customer?.address || '',
        items: ocr?.items?.map((item, idx) => ({
          description: item.name || item.description || '',
          quantity: item.quantity || '',
          unit_price: item.unit_price || '',
          tax_percentage: item.tax_percentage || '',
          line_total: item.line_total || ''
        })) || []
      });
    } catch (err) {
      setError('Failed to load invoice data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-calculate line total
      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(newItems[index].quantity) || 0;
        const price = parseFloat(newItems[index].unit_price) || 0;
        newItems[index].line_total = (qty * price).toFixed(2);
      }
      
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: '',
        unit_price: '',
        tax_percentage: '',
        line_total: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      
      await invoiceAPI.update(id, {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        total_amount: parseFloat(formData.total_amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        currency: formData.currency
      });

      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save draft');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate required fields
      if (!formData.invoice_number || !formData.invoice_date || !formData.total_amount) {
        setError('Invoice number, date, and amount are required');
        return;
      }

      if (!formData.customer_name || !formData.customer_phone) {
        setError('Customer name and phone are required');
        return;
      }

      if (formData.items.length === 0) {
        setError('At least one line item is required');
        return;
      }

      const submissionData = {
        invoice: {
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          total_amount: parseFloat(formData.total_amount),
          tax_amount: parseFloat(formData.tax_amount) || 0,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          currency: formData.currency
        },
        customer: {
          name: formData.customer_name,
          phone: formData.customer_phone,
          email: formData.customer_email || null,
          gstin: formData.customer_gstin || null,
          address: formData.customer_address || null
        },
        items: formData.items.map((item, idx) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          tax_percentage: parseFloat(item.tax_percentage) || 0,
          line_total: parseFloat(item.line_total),
          position: idx + 1
        }))
      };

      await invoiceAPI.submit(id, submissionData);
      
      setSuccess('Invoice submitted for approval!');
      setTimeout(() => {
        navigate('/dashboard/review');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit invoice');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/review')}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Review Queue
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Invoice</h1>
        <p className="text-gray-600 mt-2">
          Verify and correct the data extracted by OCR
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
        >
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Preview */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
            
            {documents.length > 0 ? (
              <div>
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={`/api/documents/${documents[currentImageIndex]?.document_id}`}
                    alt={`Invoice page ${currentImageIndex + 1}`}
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {documents.length > 1 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <button
                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                        disabled={currentImageIndex === 0}
                        className="btn-secondary text-sm disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        {currentImageIndex + 1} of {documents.length}
                      </span>
                      <button
                        onClick={() => setCurrentImageIndex(Math.min(documents.length - 1, currentImageIndex + 1))}
                        disabled={currentImageIndex === documents.length - 1}
                        className="btn-secondary text-sm disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>

                    {/* Thumbnail strip */}
                    <div className="flex gap-2 overflow-x-auto">
                      {documents.map((doc, idx) => (
                        <img
                          key={doc.document_id}
                          src={`/api/documents/${doc.document_id}`}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                            idx === currentImageIndex ? 'border-indigo-600' : 'border-gray-300'
                          }`}
                          onClick={() => setCurrentImageIndex(idx)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No documents available
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Invoice Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="tax_amount"
                    value={formData.tax_amount}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_amount"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="ABC Traders"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    name="customer_gstin"
                    value={formData.customer_gstin}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    className="input-field"
                    rows="2"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Line Items</h2>
                <button
                  onClick={addItem}
                  className="btn-secondary text-sm"
                >
                  + Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No items added. Click "+ Add Item" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-gray-700">Item {index + 1}</h3>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="input-field text-sm"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="input-field text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tax %
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.tax_percentage}
                            onChange={(e) => handleItemChange(index, 'tax_percentage', e.target.value)}
                            className="input-field text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-5">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Line Total: <span className="text-indigo-600">₹{item.line_total || '0.00'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="btn-secondary"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewInvoiceDetail;
