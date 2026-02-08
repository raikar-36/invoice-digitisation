import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoiceAPI, customerAPI } from '../services/api';
import CustomerMatchCard from '../components/CustomerMatchCard';
import CustomerSuggestions from '../components/CustomerSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

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
  const [fieldErrors, setFieldErrors] = useState({});

  // Customer matching state
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [matchType, setMatchType] = useState('none');
  const [customerSelection, setCustomerSelection] = useState('existing'); // 'existing' or 'different'
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const searchTimeoutRef = useRef(null);

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

  // Debounced customer search function
  const searchCustomer = useCallback(async (phone, name) => {
    if (!phone && (!name || name.trim().length < 3)) {
      setMatchedCustomer(null);
      setCustomerSuggestions([]);
      setMatchType('none');
      return;
    }

    try {
      setSearchingCustomer(true);
      const response = await customerAPI.matchCustomer({ phone, name });
      
      if (response.data.matchType === 'exact') {
        setMatchedCustomer(response.data.customer);
        setCustomerSuggestions([]);
        setMatchType('exact');
        setCustomerSelection('existing');
      } else if (response.data.matchType === 'fuzzy') {
        setMatchedCustomer(null);
        setCustomerSuggestions(response.data.suggestions);
        setMatchType('fuzzy');
      } else {
        setMatchedCustomer(null);
        setCustomerSuggestions([]);
        setMatchType('none');
      }
    } catch (err) {
      console.error('Customer search error:', err);
    } finally {
      setSearchingCustomer(false);
    }
  }, []);

  // Trigger search when phone or name changes (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomer(formData.customer_phone, formData.customer_name);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.customer_phone, formData.customer_name, searchCustomer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Reset customer selection when phone changes
    if (name === 'customer_phone' && matchedCustomer) {
      setCustomerSelection('existing');
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setMatchedCustomer(suggestion);
    setCustomerSuggestions([]);
    setMatchType('exact');
    setCustomerSelection('existing');
    
    // Auto-fill form with selected customer data
    setFormData(prev => ({
      ...prev,
      customer_name: suggestion.name || '',
      customer_phone: suggestion.phone || '',
      customer_email: suggestion.email || '',
      customer_gstin: suggestion.gstin || '',
      customer_address: suggestion.address || ''
    }));
  };

  const handleCustomerSelectionChange = (selection) => {
    setCustomerSelection(selection);
    
    if (selection === 'existing' && matchedCustomer) {
      // Auto-fill with matched customer data
      setFormData(prev => ({
        ...prev,
        customer_name: matchedCustomer.name || '',
        customer_phone: matchedCustomer.phone || '',
        customer_email: matchedCustomer.email || '',
        customer_gstin: matchedCustomer.gstin || '',
        customer_address: matchedCustomer.address || ''
      }));
    }
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
    
    // Clear field error for this item field
    const errorKey = `items[${index}].${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => ({ ...prev, [errorKey]: null }));
    }
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
      setFieldErrors({});

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
        })),
        // Customer matching flags
        useExistingCustomer: matchType === 'exact' && customerSelection === 'existing',
        existingCustomerId: (matchType === 'exact' && customerSelection === 'existing') ? matchedCustomer?.id : null
      };

      await invoiceAPI.submit(id, submissionData);
      
      setSuccess('Invoice submitted for approval!');
      setTimeout(() => {
        navigate('/dashboard/review');
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      
      // Check if we have validation errors
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        setFieldErrors(errors);
        
        // Create a user-friendly error message
        const errorCount = Object.keys(errors).length;
        setError(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} highlighted below`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit invoice');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card className="text-center py-12">
        <CardContent className="pt-6">
          <p className="text-xl text-muted-foreground">Invoice not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/review')}
          className="text-primary hover:text-primary"
        >
          ← Back to Review Queue
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">Review Invoice</h1>
        <p className="text-muted-foreground mt-2">
          Verify and correct the data extracted by OCR
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-emerald-50 text-emerald-700 border-emerald-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div>
                  <div className="bg-muted rounded-lg overflow-hidden mb-4" style={{ minHeight: '400px' }}>
                    {documents[currentImageIndex]?.content_type === 'application/pdf' ? (
                      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                        <svg className="w-32 h-32 text-red-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6"/>
                          <path d="M9 13h6M9 17h3"/>
                        </svg>
                        <h3 className="text-lg font-semibold mb-2">PDF Document</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                          {documents[currentImageIndex]?.file_name || 'Invoice.pdf'}
                        </p>
                        <Button
                          onClick={() => window.open(`/api/documents/${documents[currentImageIndex]?.document_id}`, '_blank')}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open in New Tab
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={`/api/documents/${documents[currentImageIndex]?.document_id}`}
                        alt={`Invoice page ${currentImageIndex + 1}`}
                        className="w-full h-auto"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    )}
                  </div>

                  {documents.length > 1 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                          disabled={currentImageIndex === 0}
                        >
                          ← Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {currentImageIndex + 1} of {documents.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentImageIndex(Math.min(documents.length - 1, currentImageIndex + 1))}
                          disabled={currentImageIndex === documents.length - 1}
                        >
                          Next →
                        </Button>
                      </div>

                      {/* Thumbnail strip */}
                      <div className="flex gap-2 overflow-x-auto">
                        {documents.map((doc, idx) => (
                          <img
                            key={doc.document_id}
                            src={`/api/documents/${doc.document_id}`}
                            alt={`Thumbnail ${idx + 1}`}
                            className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                              idx === currentImageIndex ? 'border-primary' : 'border-border'
                            }`}
                            onClick={() => setCurrentImageIndex(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No documents available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Invoice Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold tracking-tight mb-4">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">
                      Invoice Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="invoice_number"
                      type="text"
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleInputChange}
                      className={fieldErrors['invoice.invoice_number'] ? 'border-destructive' : ''}
                      placeholder="INV-001"
                    />
                    {fieldErrors['invoice.invoice_number'] && (
                      <p className="text-destructive text-xs">⚠️ {fieldErrors['invoice.invoice_number']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">
                      Invoice Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      name="invoice_date"
                      value={formData.invoice_date}
                      onChange={handleInputChange}
                      className={fieldErrors['invoice.invoice_date'] ? 'border-destructive' : ''}
                    />
                    {fieldErrors['invoice.invoice_date'] && (
                      <p className="text-destructive text-xs">⚠️ {fieldErrors['invoice.invoice_date']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">
                      Total Amount <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      className={`font-mono tabular-nums ${fieldErrors['invoice.total_amount'] ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                    />
                    {fieldErrors['invoice.total_amount'] && (
                      <p className="text-destructive text-xs">⚠️ {fieldErrors['invoice.total_amount']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_amount">Tax Amount</Label>
                    <Input
                      id="tax_amount"
                      type="number"
                      step="0.01"
                      name="tax_amount"
                      value={formData.tax_amount}
                      onChange={handleInputChange}
                      className="font-mono tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      step="0.01"
                      name="discount_amount"
                      value={formData.discount_amount}
                      onChange={handleInputChange}
                      className="font-mono tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" value={formData.currency} onValueChange={(value) => handleInputChange({ target: { name: 'currency', value } })}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            {/* Customer Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Details</h2>
              
              {/* Customer Match Card - Exact Match */}
              {matchType === 'exact' && matchedCustomer && (
                <CustomerMatchCard
                  customer={matchedCustomer}
                  selectedOption={customerSelection}
                  onOptionChange={handleCustomerSelectionChange}
                />
              )}

              {/* Customer Suggestions - Fuzzy Matches */}
              {matchType === 'fuzzy' && customerSuggestions.length > 0 && (
                <CustomerSuggestions
                  suggestions={customerSuggestions}
                  onSelect={handleSuggestionSelect}
                />
              )}

              {/* Loading Indicator */}
              {searchingCustomer && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-700">Searching for existing customer...</span>
                </div>
              )}

              {/* New Customer Badge */}
              {matchType === 'none' && !searchingCustomer && formData.customer_phone && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">🆕 New Customer</span>
                    <span className="text-sm text-blue-700">
                      This will create a new customer record
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={`input-field ${
                      matchType === 'exact' && customerSelection === 'existing'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : ''
                    } ${fieldErrors['customer.name'] ? 'border-red-500 border-2' : ''}`}
                    placeholder="ABC Traders"
                  />
                  {fieldErrors['customer.name'] && (
                    <p className="text-red-600 text-xs mt-1">⚠️ {fieldErrors['customer.name']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={`input-field ${
                      matchType === 'exact' && customerSelection === 'existing'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : ''
                    } ${fieldErrors['customer.phone'] ? 'border-red-500 border-2' : ''}`}
                    placeholder="+91-9876543210"
                  />
                  {fieldErrors['customer.phone'] && (
                    <p className="text-red-600 text-xs mt-1">⚠️ {fieldErrors['customer.phone']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={`input-field ${
                      matchType === 'exact' && customerSelection === 'existing'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : ''
                    }`}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    name="customer_gstin"
                    value={formData.customer_gstin}
                    onChange={handleInputChange}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={`input-field ${
                      matchType === 'exact' && customerSelection === 'existing'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : ''
                    }`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={`input-field ${
                      matchType === 'exact' && customerSelection === 'existing'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : ''
                    }`}
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
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className={`input-field text-sm ${fieldErrors[`items[${index}].description`] ? 'border-red-500 border-2' : ''}`}
                            placeholder="Product name"
                          />
                          {fieldErrors[`items[${index}].description`] && (
                            <p className="text-red-600 text-xs mt-1">⚠️ {fieldErrors[`items[${index}].description`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className={`input-field text-sm ${fieldErrors[`items[${index}].quantity`] ? 'border-red-500 border-2' : ''}`}
                            placeholder="1"
                          />
                          {fieldErrors[`items[${index}].quantity`] && (
                            <p className="text-red-600 text-xs mt-1">⚠️ {fieldErrors[`items[${index}].quantity`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className={`input-field text-sm ${fieldErrors[`items[${index}].unit_price`] ? 'border-red-500 border-2' : ''}`}
                            placeholder="0.00"
                          />
                          {fieldErrors[`items[${index}].unit_price`] && (
                            <p className="text-red-600 text-xs mt-1">⚠️ {fieldErrors[`items[${index}].unit_price`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tax %
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.tax_percentage}
                            onChange={(e) => handleItemChange(index, 'tax_percentage', e.target.value)}
                            className={`input-field text-sm ${fieldErrors[`items[${index}].tax_percentage`] ? 'border-red-500 border-2' : ''}`}
                            placeholder="0"
                          />
                          {fieldErrors[`items[${index}].tax_percentage`] && (
                            <p className="text-red-600 text-xs mt-1">⚠️ {fieldErrors[`items[${index}].tax_percentage`]}</p>
                          )}
                        </div>
                        <div className="col-span-2 md:col-span-5">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit for Approval →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewInvoiceDetail;
