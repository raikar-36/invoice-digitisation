import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoiceAPI, customerAPI, productAPI } from '../services/api';
import CustomerMatchCard from '../components/CustomerMatchCard';
import CustomerSuggestions from '../components/CustomerSuggestions';
import ProductAutoComplete from '../components/ProductAutoComplete';
import SimilarProductsModal from '../components/SimilarProductsModal';
import DuplicateInvoiceAlert from '../components/DuplicateInvoiceAlert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, AlertTriangle, Package, Plus, Minus } from 'lucide-react';

// Custom NumberInput component with stepper buttons
const NumberInput = forwardRef(({ value, onChange, step = "1", placeholder, className, id, ...props }, ref) => {
  const inputRef = useRef(null);
  
  // Use forwarded ref or internal ref
  const actualRef = ref || inputRef;

  useEffect(() => {
    const input = actualRef.current;
    if (!input) return;

    const handleWheel = (e) => {
      e.preventDefault();
    };

    input.addEventListener('wheel', handleWheel, { passive: false });
    return () => input.removeEventListener('wheel', handleWheel);
  }, [actualRef]);

  const increment = () => {
    const currentValue = parseFloat(value) || 0;
    const stepValue = parseFloat(step);
    const newValue = (currentValue + stepValue).toFixed(step.includes('.') ? step.split('.')[1].length : 0);
    onChange({ target: { value: newValue } });
  };

  const decrement = () => {
    const currentValue = parseFloat(value) || 0;
    const stepValue = parseFloat(step);
    const newValue = Math.max(0, currentValue - stepValue).toFixed(step.includes('.') ? step.split('.')[1].length : 0);
    onChange({ target: { value: newValue } });
  };

  return (
    <div className="relative">
      <Input
        ref={actualRef}
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={onChange}
        onWheel={(e) => e.target.blur()}
        placeholder={placeholder}
        className={`pr-16 ${className}`}
        {...props}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={decrement}
          tabIndex={-1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={increment}
          tabIndex={-1}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

const ReviewInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Add refs for auto-scroll
  const invoiceNumberRef = useRef(null);
  const invoiceDateRef = useRef(null);
  const totalAmountRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerPhoneRef = useRef(null);
  const itemRefs = useRef({});
  
  const [invoice, setInvoice] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Customer matching state
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [matchType, setMatchType] = useState('none');
  const [customerSelection, setCustomerSelection] = useState('existing'); // 'existing' or 'different'
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Feature 2: Similar products modal state
  const [showSimilarProductsModal, setShowSimilarProductsModal] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [pendingProductName, setPendingProductName] = useState('');
  const [pendingProductItemIndex, setPendingProductItemIndex] = useState(null);

  // Feature 3: Duplicate invoice detection state
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateInvoices, setDuplicateInvoices] = useState([]);
  const [pendingSubmissionData, setPendingSubmissionData] = useState(null);

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

  // Check if sum of line items matches total amount
  const checkTotalSum = useCallback(() => {
    const totalAmount = parseFloat(formData.total_amount) || 0;
    if (totalAmount <= 0 || formData.items.length === 0) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['total_amount'];
        delete newErrors['invoice.total_amount'];
        return newErrors;
      });
      return;
    }

    const calculatedTotal = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);

    const tolerance = 0.02; // 2 paisa tolerance
    const difference = Math.abs(calculatedTotal - totalAmount);

    if (difference > tolerance) {
      setFieldErrors(prev => ({
        ...prev,
        'total_amount': `Invoice total (₹${totalAmount.toFixed(2)}) must match sum of line items (₹${calculatedTotal.toFixed(2)}). Please correct before submitting.`
      }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['total_amount'];
        delete newErrors['invoice.total_amount'];
        return newErrors;
      });
    }
  }, [formData.total_amount, formData.items]);

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

  // Trigger total sum validation when total_amount or items change
  useEffect(() => {
    if (formData.items.length > 0 && formData.total_amount) {
      checkTotalSum();
    }
  }, [formData.total_amount, formData.items, checkTotalSum]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Auto-uppercase GSTIN
    if (name === 'customer_gstin') {
      processedValue = value.toUpperCase();
    }
    
    // Phone number sanitization - allow only digits, spaces, +, -, ()
    if (name === 'customer_phone') {
      processedValue = value.replace(/[^0-9+\-\s()]/g, '');
      // Limit to 15 characters
      if (processedValue.length > 15) {
        processedValue = processedValue.substring(0, 15);
      }
    }
    
    // Email validation - trim spaces
    if (name === 'customer_email') {
      processedValue = value.trim().toLowerCase();
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear field error when user starts typing
    const errorKey = `invoice.${name}` in fieldErrors ? `invoice.${name}` : 
                     `customer.${name.replace('customer_', '')}` in fieldErrors ? `customer.${name.replace('customer_', '')}` : 
                     name;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => ({ ...prev, [errorKey]: null }));
    }
    
    // Reset customer selection when phone changes
    if (name === 'customer_phone' && matchedCustomer) {
      setCustomerSelection('existing');
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear field error when user modifies field
    const errorKey = `invoice.${fieldName}` in fieldErrors ? `invoice.${fieldName}` : fieldName;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => ({ ...prev, [errorKey]: null }));
    }
    
    // Check total sum when total_amount changes
    if (fieldName === 'total_amount') {
      setTimeout(() => checkTotalSum(), 100);
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
    
    // Check total sum after updating items
    setTimeout(() => checkTotalSum(), 100);
  };

  // Feature 1: Handle product selection from autocomplete
  const handleProductSelect = (index, product) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        description: product.name,
        unit_price: product.standard_price || newItems[index].unit_price,
        product_id: product.id
      };
      
      // Auto-calculate line total if quantity exists
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(product.standard_price || newItems[index].unit_price) || 0;
      if (qty > 0 && price > 0) {
        newItems[index].line_total = (qty * price).toFixed(2);
      }
      
      return { ...prev, items: newItems };
    });
    setTimeout(() => checkTotalSum(), 100);
  };

  // Handle normal item description change (without product selection)
  const handleItemDescriptionChange = (index, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        description: value,
        // Clear product_id when user manually edits
        product_id: null
      };
      return { ...prev, items: newItems };
    });
    
    // Clear field error
    const errorKey = `items[${index}].description`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  // Feature 2: Handle create new product request
  const handleCreateNewProduct = async (index, productName) => {
    try {
      // Check for similar products
      const response = await productAPI.findSimilar(productName);
      const similar = response.data.similarProducts || [];
      
      if (similar.length > 0) {
        // Show modal with similar products
        setSimilarProducts(similar);
        setPendingProductName(productName);
        setPendingProductItemIndex(index);
        setShowSimilarProductsModal(true);
      } else {
        // No similar products, just use the name (product will be created during approval)
        setFormData(prev => {
          const newItems = [...prev.items];
          newItems[index] = {
            ...newItems[index],
            description: productName
          };
          return { ...prev, items: newItems };
        });
      }
    } catch (error) {
      console.error('Error checking similar products:', error);
      // Fallback: just use the product name
      setFormData(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          description: productName
        };
        return { ...prev, items: newItems };
      });
    }
  };

  // Feature 2: Create new product - REMOVED, products created during approval
  // This function is no longer needed as products are created by backend during approval

  // Feature 2: Handle using existing product from modal
  const handleUseExistingProduct = (product) => {
    if (pendingProductItemIndex !== null) {
      handleProductSelect(pendingProductItemIndex, product);
    }
    setShowSimilarProductsModal(false);
    setSimilarProducts([]);
    setPendingProductName('');
    setPendingProductItemIndex(null);
  };

  // Feature 2: Handle creating new product anyway from modal
  const handleCreateNewProductAnyway = () => {
    // Just use the product name, product will be created during approval
    if (pendingProductItemIndex !== null && pendingProductName) {
      setFormData(prev => {
        const newItems = [...prev.items];
        newItems[pendingProductItemIndex] = {
          ...newItems[pendingProductItemIndex],
          description: pendingProductName
        };
        return { ...prev, items: newItems };
      });
    }
    setShowSimilarProductsModal(false);
    setSimilarProducts([]);
    setPendingProductName('');
    setPendingProductItemIndex(null);
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
    setTimeout(() => checkTotalSum(), 100);
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setTimeout(() => checkTotalSum(), 100);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Prepare customer data
      const customerData = {
        name: formData.customer_name,
        phone: formData.customer_phone,
        email: formData.customer_email,
        gstin: formData.customer_gstin,
        address: formData.customer_address
      };

      // Prepare items data
      const itemsData = formData.items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        tax_percentage: parseFloat(item.tax_percentage) || 0,
        line_total: parseFloat(item.line_total) || 0
      }));
      
      await invoiceAPI.update(id, {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        total_amount: parseFloat(formData.total_amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        currency: formData.currency,
        customer: customerData,
        items: itemsData
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

  // Validate individual field on blur
  const validateField = (fieldName, value) => {
    let error = null;
    
    if (fieldName === 'invoice_number') {
      if (!value || value.trim() === '') {
        error = 'Invoice Number is required';
      } else if (value.length > 50) {
        error = 'Invoice number must be less than 50 characters';
      }
    } else if (fieldName === 'invoice_date') {
      if (!value) {
        error = 'Invoice Date is required';
      }
    } else if (fieldName === 'total_amount') {
      if (!value) {
        error = 'Total Amount is required';
      } else {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          error = 'Total amount must be greater than 0';
        } else if (amount > 100000000) {
          error = 'Total amount cannot exceed ₹10,00,00,000';
        }
      }
    } else if (fieldName === 'customer_name') {
      if (!value || value.trim() === '') {
        error = 'Customer Name is required';
      } else if (value.length > 200) {
        error = 'Customer name must be less than 200 characters';
      }
    } else if (fieldName === 'customer_phone') {
      if (!value || value.trim() === '') {
        error = 'Customer Phone is required';
      } else {
        const phone = value.replace(/\D/g, '');
        if (phone.length < 10) {
          error = 'Phone number must be at least 10 digits';
        } else if (phone.length > 15) {
          error = 'Phone number cannot exceed 15 digits';
        }
      }
    } else if (fieldName === 'customer_email') {
      if (value && value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = 'Invalid email format';
        } else if (value.length > 100) {
          error = 'Email must be less than 100 characters';
        }
      }
    } else if (fieldName === 'customer_gstin') {
      if (value && value.trim() !== '') {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(value)) {
          error = 'Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)';
        }
      }
    }
    
    const errorKey = fieldName.startsWith('invoice.') ? fieldName :
                     fieldName.startsWith('customer.') ? fieldName :
                     fieldName.includes('_') && fieldName.startsWith('customer') ? `customer.${fieldName.replace('customer_', '')}` :
                     `invoice.${fieldName}`;
    
    setFieldErrors(prev => ({ ...prev, [errorKey]: error }));
  };

  // Validate individual line item field on blur
  const validateItemField = (index, fieldName, value) => {
    let error = null;
    
    if (fieldName === 'quantity') {
      if (!value || value.trim() === '') {
        error = `Row ${index + 1}: Quantity is required`;
      } else {
        const qty = parseFloat(value);
        if (isNaN(qty) || qty <= 0) {
          error = `Row ${index + 1}: Quantity must be greater than 0`;
        } else if (qty > 1000000) {
          error = `Row ${index + 1}: Quantity seems unusually high`;
        }
      }
    } else if (fieldName === 'unit_price') {
      if (!value || value.trim() === '') {
        error = `Row ${index + 1}: Unit price is required`;
      } else {
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
          error = `Row ${index + 1}: Unit price must be greater than 0`;
        } else if (price > 10000000) {
          error = `Row ${index + 1}: Unit price seems unusually high`;
        }
      }
    }
    
    const errorKey = `items[${index}].${fieldName}`;
    setFieldErrors(prev => ({ ...prev, [errorKey]: error }));
  };

  const handleSubmitForApproval = async () => {
    try {
      setSubmitting(true);
      setError('');
      setWarnings([]);
      setFieldErrors({});

      // Validate required fields with specific messages
      const errors = {};
      
      if (!formData.invoice_number) {
        errors['invoice.invoice_number'] = 'Invoice Number is missing—this is required for tracking.';
      }
      
      if (!formData.invoice_date) {
        errors['invoice.invoice_date'] = 'Invoice Date is required to process this invoice.';
      }
      
      if (!formData.total_amount) {
        errors['invoice.total_amount'] = 'Total Amount must be specified.';
      }

      if (!formData.customer_name) {
        errors['customer.name'] = 'Customer Name is required to create or link this invoice.';
      }
      
      if (!formData.customer_phone) {
        errors['customer.phone'] = 'Customer Phone is required for identification.';
      }

      if (formData.items.length === 0) {
        setError('At least one line item is required');
        setSubmitting(false);
        return;
      }
      
      // Validate line items with row-specific feedback
      formData.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors[`items[${index}].description`] = `Row ${index + 1}: Item Description cannot be empty.`;
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          errors[`items[${index}].quantity`] = `Row ${index + 1}: Quantity must be greater than 0.`;
        }
        if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
          errors[`items[${index}].unit_price`] = `Row ${index + 1}: Unit Price must be greater than 0.`;
        }
      });
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const errorCount = Object.keys(errors).length;
        setError(`Please complete ${errorCount} required field${errorCount > 1 ? 's' : ''} marked below before submitting.`);
        
        // Auto-scroll to first error
        const firstErrorKey = Object.keys(errors)[0];
        let targetRef = null;
        
        if (firstErrorKey.includes('invoice_number')) targetRef = invoiceNumberRef;
        else if (firstErrorKey.includes('invoice_date')) targetRef = invoiceDateRef;
        else if (firstErrorKey.includes('total_amount')) targetRef = totalAmountRef;
        else if (firstErrorKey.includes('customer.name')) targetRef = customerNameRef;
        else if (firstErrorKey.includes('customer.phone')) targetRef = customerPhoneRef;
        else if (firstErrorKey.includes('items')) {
          const match = firstErrorKey.match(/items\[(\d+)\]/);
          if (match) {
            targetRef = itemRefs.current[match[1]];
          }
        }
        
        if (targetRef?.current) {
          targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetRef.current.focus();
        }
        
        setSubmitting(false);
        return;
      }

      const submissionData = {
        invoice: {
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          total_amount: parseFloat(formData.total_amount),
          tax_amount: parseFloat(formData.tax_amount) || 0,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          currency: formData.currency || 'INR'
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

      // Feature 3: Check for duplicate invoices before submission
      try {
        const customerId = matchedCustomer?.id || null;
        const duplicateCheckData = {
          customer_id: customerId,
          total_amount: parseFloat(formData.total_amount),
          invoice_date: formData.invoice_date,
          invoice_number: formData.invoice_number
        };

        // Only check if we have a customer (existing or will be created)
        if (customerId) {
          const duplicateResponse = await invoiceAPI.checkDuplicate(duplicateCheckData);
          
          if (duplicateResponse.data.hasDuplicates && duplicateResponse.data.duplicates.length > 0) {
            // Store submission data and show alert
            setPendingSubmissionData(submissionData);
            setDuplicateInvoices(duplicateResponse.data.duplicates);
            setShowDuplicateAlert(true);
            setSubmitting(false);
            return;
          }
        }
      } catch (duplicateError) {
        console.error('Duplicate check error:', duplicateError);
        // Continue with submission even if duplicate check fails
      }

      // No duplicates, proceed with submission
      await performSubmission(submissionData);
    } catch (err) {
      console.error('Submission error:', err);
      
      // Check if we have validation errors
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const backendWarnings = err.response.data.warnings;
        setFieldErrors(errors);
        
        // Create a user-friendly error message
        const errorCount = Object.keys(errors).length;
        setError(`Please complete ${errorCount} required field${errorCount > 1 ? 's' : ''} marked below before submitting.`);
        
        // Show warnings visually if present
        if (backendWarnings && Object.keys(backendWarnings).length > 0) {
          setWarnings(Object.values(backendWarnings));
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit invoice');
      }
      setSubmitting(false);
    }
  };

  // Feature 3: Perform actual submission
  const performSubmission = async (submissionData) => {
    try {
      setSubmitting(true);
      const response = await invoiceAPI.submit(id, submissionData);
      
      // Check for warnings in success response
      if (response.data.warnings && Object.keys(response.data.warnings).length > 0) {
        setWarnings(Object.values(response.data.warnings));
      }
      
      setSuccess('Invoice submitted for approval!');
      setTimeout(() => {
        navigate('/dashboard/review');
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      console.error('Error response data:', err.response?.data);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const backendWarnings = err.response.data.warnings;
        console.error('Validation errors:', errors);
        setFieldErrors(errors);
        const errorCount = Object.keys(errors).length;
        setError(`Please complete ${errorCount} required field${errorCount > 1 ? 's' : ''} marked below before submitting.`);
        
        // Show warnings visually if present
        if (backendWarnings && Object.keys(backendWarnings).length > 0) {
          setWarnings(Object.values(backendWarnings));
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit invoice');
      }
      setSubmitting(false);
    }
  };

  // Feature 3: Handle duplicate alert cancel
  const handleDuplicateCancel = () => {
    setShowDuplicateAlert(false);
    setDuplicateInvoices([]);
    setPendingSubmissionData(null);
  };

  // Feature 3: Handle duplicate alert proceed
  const handleDuplicateProceed = async () => {
    setShowDuplicateAlert(false);
    
    // Log the duplicate ignore action
    try {
      if (duplicateInvoices.length > 0) {
        await invoiceAPI.logDuplicateIgnored({
          invoice_id: id,
          matched_invoice_id: duplicateInvoices[0].id
        });
      }
    } catch (logError) {
      console.error('Failed to log duplicate ignore:', logError);
      // Continue with submission even if logging fails
    }
    
    // Proceed with submission
    if (pendingSubmissionData) {
      await performSubmission(pendingSubmissionData);
    }
    
    setDuplicateInvoices([]);
    setPendingSubmissionData(null);
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

      {warnings.length > 0 && (
        <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-300">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          <AlertDescription>
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </AlertDescription>
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
                      ref={invoiceNumberRef}
                      id="invoice_number"
                      type="text"
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('invoice_number', e.target.value)}
                      className={`font-mono tracking-tighter ${fieldErrors['invoice.invoice_number'] ? 'border-destructive' : ''}`}
                      placeholder="INV-001"
                      maxLength={50}
                      required
                    />
                    {fieldErrors['invoice.invoice_number'] && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {fieldErrors['invoice.invoice_number']}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">
                      Invoice Date <span className="text-destructive">*</span>
                    </Label>
                    <div ref={invoiceDateRef}>
                      <DatePicker
                        value={formData.invoice_date}
                        onChange={(date) => handleFieldChange('invoice_date', date)}
                        placeholder="Select invoice date"
                      />
                    </div>
                    {fieldErrors['invoice.invoice_date'] && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {fieldErrors['invoice.invoice_date']}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">
                      Total Amount <span className="text-destructive">*</span>
                    </Label>
                    <NumberInput
                      ref={totalAmountRef}
                      id="total_amount"
                      step="0.01"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('total_amount', e.target.value)}
                      className={`font-mono tracking-tighter tabular-nums ${fieldErrors['invoice.total_amount'] || fieldErrors['total_amount'] ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      min="0.01"
                      max="100000000"
                      required
                    />
                    {(fieldErrors['invoice.total_amount'] || fieldErrors['total_amount']) && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {fieldErrors['invoice.total_amount'] || fieldErrors['total_amount']}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_amount">Tax Amount</Label>
                    <NumberInput
                      id="tax_amount"
                      step="0.01"
                      name="tax_amount"
                      value={formData.tax_amount}
                      onChange={handleInputChange}
                      className={`font-mono tracking-tighter tabular-nums ${fieldErrors['tax_amount'] ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      min="0"
                      max="10000000"
                    />
                    {fieldErrors['tax_amount'] && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {fieldErrors['tax_amount']}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <NumberInput
                      id="discount_amount"
                      step="0.01"
                      name="discount_amount"
                      value={formData.discount_amount}
                      onChange={handleInputChange}
                      className={`font-mono tracking-tighter tabular-nums ${fieldErrors['discount_amount'] ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      min="0"
                      max="10000000"
                    />
                    {fieldErrors['discount_amount'] && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {fieldErrors['discount_amount']}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" value={formData.currency} onValueChange={(value) => handleInputChange({ target: { name: 'currency', value } })}>
                      <SelectTrigger id="currency" className="hover:bg-accent transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            {/* Customer Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Customer Details</h2>
              
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
                <Card className="mb-4 bg-blue-500/5 border-border/50">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-muted-foreground">Searching for existing customer...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New Customer Badge */}
              {matchType === 'none' && !searchingCustomer && formData.customer_phone && (
                <Card className="mb-4 bg-blue-500/5 border-border/50">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">New Customer</span>
                      <span className="text-sm text-muted-foreground">
                        This will create a new customer record
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={customerNameRef}
                    id="customer_name"
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField('customer_name', e.target.value)}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={fieldErrors['customer.name'] ? 'border-destructive' : ''}
                    placeholder="ABC Traders"
                    maxLength={200}
                    required
                  />
                  {fieldErrors['customer.name'] && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {fieldErrors['customer.name']}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={customerPhoneRef}
                    id="customer_phone"
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField('customer_phone', e.target.value)}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    className={fieldErrors['customer.phone'] ? 'border-destructive' : ''}
                    placeholder="+91-9876543210"
                    maxLength={15}
                    required
                  />
                  {fieldErrors['customer.phone'] && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {fieldErrors['customer.phone']}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField('customer_email', e.target.value)}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    placeholder="customer@example.com"
                    maxLength={100}
                  />
                  {fieldErrors['customer.email'] && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {fieldErrors['customer.email']}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_gstin">GSTIN</Label>
                  <Input
                    id="customer_gstin"
                    type="text"
                    name="customer_gstin"
                    value={formData.customer_gstin}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField('customer_gstin', e.target.value)}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {fieldErrors['customer.gstin'] && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {fieldErrors['customer.gstin']}
                    </p>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="customer_address">Address</Label>
                  <Textarea
                    id="customer_address"
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    disabled={matchType === 'exact' && customerSelection === 'existing'}
                    rows={2}
                    placeholder="123 Main St, City, State, ZIP"
                    maxLength={500}
                  />
                  {fieldErrors['customer.address'] && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {fieldErrors['customer.address']}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold tracking-tight">Line Items</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  + Add Item
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <Card className="text-center py-8 bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">No items added. Click "+ Add Item" to start.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <Card key={index} ref={(el) => (itemRefs.current[index] = el)}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold tracking-tight">Item {index + 1}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor={`item_description_${index}`}>
                              Item Name / Description
                            </Label>
                            <ProductAutoComplete
                              value={item.description}
                              onChange={(value) => handleItemDescriptionChange(index, value)}
                              onProductSelect={(product) => handleProductSelect(index, product)}
                              onCreateNew={(productName) => handleCreateNewProduct(index, productName)}
                              placeholder="Type product name..."
                              className={fieldErrors[`items[${index}].description`] ? 'border-destructive' : ''}
                            />
                            {fieldErrors[`items[${index}].description`] && (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {fieldErrors[`items[${index}].description`]}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item_quantity_${index}`}>Quantity</Label>
                            <NumberInput
                              id={`item_quantity_${index}`}
                              step="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              onBlur={(e) => validateItemField(index, 'quantity', e.target.value)}
                              className={fieldErrors[`items[${index}].quantity`] ? 'border-destructive' : ''}
                              placeholder="1"
                              min="0.01"
                              max="1000000"
                              required
                            />
                            {fieldErrors[`items[${index}].quantity`] && (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {fieldErrors[`items[${index}].quantity`]}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item_unit_price_${index}`}>Unit Price</Label>
                            <NumberInput
                              id={`item_unit_price_${index}`}
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              onBlur={(e) => validateItemField(index, 'unit_price', e.target.value)}
                              className={`font-mono tracking-tighter ${fieldErrors[`items[${index}].unit_price`] ? 'border-destructive' : ''}`}
                              placeholder="0.00"
                              min="0.01"
                              max="10000000"
                              required
                            />
                            {fieldErrors[`items[${index}].unit_price`] && (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {fieldErrors[`items[${index}].unit_price`]}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item_tax_percentage_${index}`}>Tax %</Label>
                            <NumberInput
                              id={`item_tax_percentage_${index}`}
                              step="0.01"
                              value={item.tax_percentage}
                              onChange={(e) => handleItemChange(index, 'tax_percentage', e.target.value)}
                              className={fieldErrors[`items[${index}].tax_percentage`] ? 'border-destructive' : ''}
                              placeholder="0"
                              min="0"
                              max="100"
                            />
                            {fieldErrors[`items[${index}].tax_percentage`] && (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {fieldErrors[`items[${index}].tax_percentage`]}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2 md:col-span-5 pt-2 border-t">
                            <Label className="text-muted-foreground">
                              Line Total: <span className="text-primary font-mono tracking-tighter">₹{item.line_total || '0.00'}</span>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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

      {/* Feature 2: Similar Products Modal */}
      <SimilarProductsModal
        open={showSimilarProductsModal}
        onOpenChange={setShowSimilarProductsModal}
        newProductName={pendingProductName}
        similarProducts={similarProducts}
        onUseExisting={handleUseExistingProduct}
        onCreateNew={handleCreateNewProductAnyway}
      />

      {/* Feature 3: Duplicate Invoice Alert */}
      <DuplicateInvoiceAlert
        open={showDuplicateAlert}
        onOpenChange={setShowDuplicateAlert}
        duplicates={duplicateInvoices}
        onCancel={handleDuplicateCancel}
        onProceed={handleDuplicateProceed}
      />
    </div>
  );
};

export default ReviewInvoiceDetail;
