const { getPostgresPool } = require('../config/database');
const documentService = require('../services/document.service');
const ocrService = require('../services/ocr.service');
const auditService = require('../services/audit.service');
const auditHelper = require('../utils/auditHelper');
const { normalizePhone } = require('../utils/phoneNormalizer');
const { normalizeDate } = require('../utils/dateNormalizer');
const { invalidateAnalyticsCache } = require('../utils/cacheManager');
const PDFDocument = require('pdfkit');

// Validation helper
const validateInvoiceData = (data) => {
  const errors = {};

  if (!data.invoice_number || data.invoice_number.trim() === '') {
    errors.invoice_number = 'Invoice number is required';
  }

  if (!data.invoice_date) {
    errors.invoice_date = 'Invoice date is required';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one line item is required';
  } else {
    data.items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        errors[`items[${index}].quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unit_price || item.unit_price <= 0) {
        errors[`items[${index}].unit_price`] = 'Unit price must be greater than 0';
      }
    });
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

exports.uploadInvoice = async (req, res) => {
  try {
    const files = req.files;
    const userId = req.user.userId;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log('\n========== PROCESSING OCR ==========');
    console.log('Files count:', files.length);
    console.log('Uploaded by user:', userId);

    // Process OCR first before any database operations
    let rawOcr, normalized;
    try {
      const ocrResult = await ocrService.processOcr(files);
      
      // Check if OCR service returned valid result structure
      if (!ocrResult || typeof ocrResult !== 'object') {
        throw new Error('OCR service returned invalid response structure');
      }
      
      rawOcr = ocrResult.rawOcr || {};
      normalized = ocrResult.normalized || {};
      
      console.log('✅ OCR Processing Successful');
      console.log('Extracted Invoice Number:', normalized?.invoice?.invoice_number || 'Not extracted (will be filled manually)');
      console.log('Extracted Amount:', normalized?.invoice?.total_amount || 'Not extracted (will be filled manually)');
      console.log('Extracted Date:', normalized?.invoice?.invoice_date || 'Not extracted (will be filled manually)');
      console.log('Note: Missing fields will be filled during review process');
    } catch (ocrError) {
      console.error('❌ OCR Service Failed:', ocrError);
      console.error('Error message:', ocrError.message);
      console.error('Error stack:', ocrError.stack);
      
      // Stop execution - OCR service failed
      return res.status(500).json({
        success: false,
        message: 'OCR service failed to process the invoice. Please ensure the uploaded files are clear invoice images or PDFs.',
        error: process.env.NODE_ENV === 'development' ? ocrError.message : undefined
      });
    }

    console.log('\n========== STARTING DATABASE TRANSACTIONS ==========');

    const pool = getPostgresPool();

    // Create invoice record (invoice_date will be updated from OCR)
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (invoice_number, invoice_date, total_amount, status, created_by, created_at)
       VALUES ($1, NOW(), $2, $3, $4, NOW())
       RETURNING id`,
      [
        normalized?.invoice?.invoice_number || 'PENDING',
        normalized?.invoice?.total_amount || 0,
        'PENDING_REVIEW',
        userId
      ]
    );

    const invoiceId = invoiceResult.rows[0].id;
    console.log('✅ Invoice created with ID:', invoiceId);

    // Store files in MongoDB
    const documentPromises = files.map((file, index) => 
      documentService.storeDocument({
        invoiceId,
        documentType: 'ORIGINAL',
        fileName: file.originalname,
        contentType: file.mimetype,
        fileData: file.buffer,
        position: index + 1,
        uploadedBy: userId
      })
    );

    await Promise.all(documentPromises);
    console.log('✅ Documents stored in MongoDB');

    // Store OCR data
    await documentService.storeOcrData({
      invoiceId,
      rawOcrJson: rawOcr,
      normalizedOcrJson: normalized
    });
    console.log('✅ OCR data stored');

    // Update invoice with OCR extracted data
    if (normalized?.invoice) {
      // Normalize date to PostgreSQL format (YYYY-MM-DD)
      const normalizedDate = normalized.invoice.invoice_date 
        ? normalizeDate(normalized.invoice.invoice_date) 
        : null;

      console.log('Normalized date:', {
        original: normalized.invoice.invoice_date,
        normalized: normalizedDate
      });

      await pool.query(
        `UPDATE invoices 
         SET invoice_number = COALESCE($1, invoice_number),
             invoice_date = COALESCE($2, invoice_date),
             total_amount = COALESCE($3, total_amount)
         WHERE id = $4`,
        [
          normalized.invoice.invoice_number || null,
          normalizedDate,
          normalized.invoice.total_amount || null,
          invoiceId
        ]
      );
      console.log('✅ Invoice updated with OCR data');
    }

    // Log audit with comprehensive details
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const userName = userResult.rows[0]?.name || 'User';
    
    await auditService.log({
      invoiceId,
      userId,
      action: 'INVOICE_UPLOADED',
      details: auditHelper.createInvoiceAuditDetails('INVOICE_UPLOADED', {
        invoiceNumber: normalized?.invoice?.invoice_number,
        totalAmount: normalized?.invoice?.total_amount,
        userName: userName,
        customerName: normalized?.invoice?.customer_name || 'Unknown Customer'
      })
    });

    console.log('========== UPLOAD COMPLETE ==========\n');

    res.status(201).json({
      success: true,
      message: `Invoice uploaded successfully! OCR extracted: ${normalized?.invoice?.invoice_number || 'Unknown'} - ₹${normalized?.invoice?.total_amount?.toLocaleString('en-IN') || '0'}`,
      invoiceId,
      ocrData: normalized
    });
  } catch (error) {
    console.error('Upload invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload invoice. Please try again.'
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo, minAmount, maxAmount, createdBy } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const pool = getPostgresPool();
    
    let query = `
      SELECT 
        i.id, i.invoice_number, i.invoice_date, i.total_amount, 
        i.status, i.created_at, i.generated_pdf_document_id,
        i.submitted_at, i.rejection_reason, i.created_by,
        c.name as customer_name, c.phone as customer_phone,
        u.name as created_by_name,
        s.name as submitted_by_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN users s ON i.submitted_by = s.id
      WHERE 1=1
    `;
    
    const params = [];

    // Role-based filtering ONLY (security requirement)
    if (userRole === 'STAFF' || userRole === 'ACCOUNTANT') {
      // Staff and Accountants can ONLY see their own invoices
      params.push(userId);
      query += ` AND i.created_by = $${params.length}`;
    }
    // For OWNER: fetch ALL invoices, filtering done client-side

    query += ' ORDER BY i.created_at DESC';

    const result = await pool.query(query, params);

    // Enhance each invoice with OCR data and document count for PENDING_REVIEW status
    const invoices = await Promise.all(result.rows.map(async (invoice) => {
      // Get document count
      const documents = await documentService.getDocumentsByInvoice(invoice.id);
      invoice.document_count = documents.length;

      // For PENDING_REVIEW invoices, always use OCR data for display
      if (invoice.status === 'PENDING_REVIEW') {
        const ocrData = await documentService.getOcrData(invoice.id);
        if (ocrData?.normalized_ocr_json) {
          // Always use OCR data for review cards (it has the extracted invoice data)
          if (ocrData.normalized_ocr_json.invoice?.invoice_number) {
            invoice.invoice_number = ocrData.normalized_ocr_json.invoice.invoice_number;
          }
          if (ocrData.normalized_ocr_json.invoice?.invoice_date) {
            invoice.invoice_date = ocrData.normalized_ocr_json.invoice.invoice_date;
          }
          if (ocrData.normalized_ocr_json.invoice?.total_amount !== undefined) {
            invoice.total_amount = ocrData.normalized_ocr_json.invoice.total_amount;
          }
          if (ocrData.normalized_ocr_json.customer?.name) {
            invoice.customer_name = ocrData.normalized_ocr_json.customer.name;
          }
        }
      }

      return invoice;
    }));

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices'
    });
  }
};

// Get list of creators with invoice counts for a specific status
exports.getCreatorsList = async (req, res) => {
  try {
    const { status } = req.query;
    const userRole = req.user.role;

    // Only OWNER can access this endpoint
    if (userRole !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners can view creator filters.'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status parameter is required'
      });
    }

    const pool = getPostgresPool();
    
    // Get all users who have created invoices with the specified status
    const query = `
      SELECT 
        u.id,
        u.name,
        COUNT(i.id) as count
      FROM users u
      INNER JOIN invoices i ON i.created_by = u.id
      WHERE i.status = $1
      GROUP BY u.id, u.name
      HAVING COUNT(i.id) > 0
      ORDER BY u.name ASC
    `;

    const result = await pool.query(query, [status]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get creators list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creators list'
    });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const pool = getPostgresPool();

    // Get invoice with details
    const invoiceResult = await pool.query(
      `SELECT 
        i.*,
        c.name as customer_name, c.phone as customer_phone, 
        c.email as customer_email, c.gstin as customer_gstin, c.address as customer_address,
        creator.name as created_by_name,
        approver.name as approved_by_name,
        submitter.name as submitted_by_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN users creator ON i.created_by = creator.id
       LEFT JOIN users approver ON i.approved_by = approver.id
       LEFT JOIN users submitter ON i.submitted_by = submitter.id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const invoice = invoiceResult.rows[0];

    // Check access permissions
    if (userRole === 'ACCOUNTANT' && invoice.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (userRole === 'STAFF' && invoice.status !== 'APPROVED' && invoice.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get line items
    const itemsResult = await pool.query(
      `SELECT 
        ii.*,
        p.name as product_name, p.sku as product_sku
       FROM invoice_items ii
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = $1
       ORDER BY ii.position`,
      [id]
    );

    // Get documents
    const documents = await documentService.getDocumentsByInvoice(id);

    // Get OCR data
    const ocrData = await documentService.getOcrData(id);

    // If invoice is pending approval and has no items yet, use OCR data
    let items = itemsResult.rows;
    let customerData = {
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone,
      customer_email: invoice.customer_email,
      customer_gstin: invoice.customer_gstin,
      customer_address: invoice.customer_address
    };

    if ((invoice.status === 'PENDING_APPROVAL' || invoice.status === 'PENDING_REVIEW') && 
        items.length === 0 && ocrData?.normalized_ocr_json) {
      // Use customer and items from OCR data (which contains reviewed form data)
      if (ocrData.normalized_ocr_json.customer) {
        customerData = {
          customer_name: ocrData.normalized_ocr_json.customer.name,
          customer_phone: ocrData.normalized_ocr_json.customer.phone,
          customer_email: ocrData.normalized_ocr_json.customer.email,
          customer_gstin: ocrData.normalized_ocr_json.customer.gstin,
          customer_address: ocrData.normalized_ocr_json.customer.address
        };
      }
      if (ocrData.normalized_ocr_json.items) {
        items = ocrData.normalized_ocr_json.items.map((item, index) => ({
          id: `temp_${index}`,
          invoice_id: id,
          product_id: null,
          product_name: item.name || item.description,
          product_sku: item.sku || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          position: index + 1
        }));
      }
    }

    res.json({
      success: true,
      invoice: {
        ...invoice,
        ...customerData,
        items: items,
        documents: documents,
        ocrData: ocrData?.normalized_ocr_json
      }
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice'
    });
  }
};

// Get invoice documents list
exports.getInvoiceDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await documentService.getDocumentsByInvoice(id);
    
    res.json({
      success: true,
      documents: documents.map(doc => ({
        document_id: doc.document_id,
        file_name: doc.file_name,
        content_type: doc.content_type,
        position: doc.position,
        created_at: doc.created_at
      }))
    });
  } catch (error) {
    console.error('Get invoice documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice documents'
    });
  }
};

// Get invoice OCR data
exports.getInvoiceOcrData = async (req, res) => {
  try {
    const { id } = req.params;
    const ocrData = await documentService.getOcrData(id);
    
    if (!ocrData) {
      return res.status(404).json({
        success: false,
        message: 'OCR data not found'
      });
    }
    
    res.json({
      success: true,
      raw_ocr_json: ocrData.raw_ocr_json,
      normalized_ocr_json: ocrData.normalized_ocr_json
    });
  } catch (error) {
    console.error('Get invoice OCR data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OCR data'
    });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const pool = getPostgresPool();

    // Check invoice exists and user has permission
    const invoiceCheck = await pool.query(
      'SELECT status, created_by FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const invoice = invoiceCheck.rows[0];

    // Only allow editing if PENDING_REVIEW or REJECTED
    if (!['PENDING_REVIEW', 'REJECTED'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be edited in current status'
      });
    }

    // Update invoice basic data
    await pool.query(
      `UPDATE invoices 
       SET invoice_number = $1, invoice_date = $2, total_amount = $3,
           tax_amount = $4, discount_amount = $5, currency = $6
       WHERE id = $7`,
      [
        updateData.invoice_number,
        updateData.invoice_date,
        updateData.total_amount,
        updateData.tax_amount,
        updateData.discount_amount,
        updateData.currency || 'INR',
        id
      ]
    );

    // Update MongoDB OCR data if customer or items are provided
    if (updateData.customer || updateData.items) {
      const ocrData = await documentService.getOcrData(id);
      if (ocrData) {
        const updatedOcrJson = {
          ...ocrData.normalized_ocr_json,
          invoice: {
            ...(ocrData.normalized_ocr_json?.invoice || {}),
            invoice_number: updateData.invoice_number,
            invoice_date: updateData.invoice_date,
            total_amount: updateData.total_amount,
            tax_amount: updateData.tax_amount,
            discount_amount: updateData.discount_amount
          }
        };

        if (updateData.customer) {
          updatedOcrJson.customer = updateData.customer;
        }

        if (updateData.items) {
          updatedOcrJson.items = updateData.items;
        }

        await documentService.updateOcrData(id, updatedOcrJson);
      }
    }

    // Log audit with comprehensive details
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'INVOICE_UPDATED',
      details: auditHelper.createInvoiceAuditDetails('INVOICE_UPDATED', {
        invoiceNumber: invoice.invoice_number,
        updatedFields: Object.keys(updateData),
        changes: auditHelper.getChangedFields(
          { 
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            total_amount: invoice.total_amount,
            customer_name: invoice.customer_name
          },
          updateData
        )
      })
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice'
    });
  }
};

exports.submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const submissionData = req.body;

    // Extract invoice data for validation (support both flat and nested structure)
    const invoiceData = submissionData.invoice || submissionData;
    const customerData = submissionData.customer || {};
    const items = submissionData.items || [];
    const useExistingCustomer = submissionData.useExistingCustomer || false;
    const existingCustomerId = submissionData.existingCustomerId || null;

    // Validate invoice data
    const validationErrors = validateInvoiceData({
      invoice_number: invoiceData.invoice_number,
      invoice_date: invoiceData.invoice_date,
      items: items
    });
    
    if (validationErrors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Validate customer data
    if (!customerData.name || !customerData.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required'
      });
    }

    const pool = getPostgresPool();

    // Check invoice status
    const invoiceCheck = await pool.query(
      'SELECT status FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!['PENDING_REVIEW', 'REJECTED'].includes(invoiceCheck.rows[0].status)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be submitted in current status'
      });
    }

    // Update invoice with submission data
    // Normalize date to PostgreSQL format
    const normalizedInvoiceDate = normalizeDate(invoiceData.invoice_date);
    
    if (!normalizedInvoiceDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice date format. Please use a valid date.'
      });
    }

    await pool.query(
      `UPDATE invoices 
       SET status = $1, submitted_by = $2, submitted_at = NOW(),
           invoice_number = $3, invoice_date = $4, total_amount = $5,
           tax_amount = $6, discount_amount = $7, currency = $8
       WHERE id = $9`,
      [
        'PENDING_APPROVAL', 
        userId, 
        invoiceData.invoice_number,
        normalizedInvoiceDate,
        invoiceData.total_amount,
        invoiceData.tax_amount,
        invoiceData.discount_amount,
        invoiceData.currency || 'INR',
        id
      ]
    );

    // Store customer and items data in MongoDB for approval
    // Get existing OCR data to preserve raw_ocr_json
    const existingOcrData = await documentService.getOcrData(id);
    
    await documentService.storeOcrData({
      invoiceId: id,
      rawOcrJson: existingOcrData?.raw_ocr_json || {},
      normalizedOcrJson: {
        invoice: invoiceData,
        customer: customerData,
        items: items,
        // Store customer matching decision
        customerMatching: {
          useExisting: useExistingCustomer,
          existingCustomerId: existingCustomerId
        }
      }
    });

    // Log audit with comprehensive details
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'INVOICE_SUBMITTED',
      details: auditHelper.createInvoiceAuditDetails('INVOICE_SUBMITTED', {
        invoiceNumber: invoiceData.invoice_number,
        totalAmount: invoiceData.total_amount
      })
    });

    // Invalidate analytics cache (new submitted invoices affect pending counts)
    invalidateAnalyticsCache();

    res.json({
      success: true,
      message: 'Invoice submitted for approval'
    });
  } catch (error) {
    console.error('Submit for approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit invoice'
    });
  }
};

exports.approveInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    let approvalData = req.body;

    const pool = getPostgresPool();

    // If no approval data provided, fetch from OCR data
    if (!approvalData.customer || !approvalData.items || approvalData.items.length === 0) {
      const ocrData = await documentService.getOcrData(id);
      if (ocrData?.normalized_ocr_json) {
        approvalData = {
          customer: ocrData.normalized_ocr_json.customer,
          items: ocrData.normalized_ocr_json.items
        };
      }
    }

    // Validate we have required data
    if (!approvalData.customer || !approvalData.items || approvalData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer and items data required for approval'
      });
    }

    // Check invoice status
    const invoiceCheck = await pool.query(
      'SELECT status FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoiceCheck.rows[0].status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not pending approval'
      });
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('\n========== APPROVAL TRANSACTION STARTED ==========');
      console.log('Invoice ID:', id);
      console.log('User ID:', userId);
      console.log('Customer Data:', JSON.stringify(approvalData.customer, null, 2));
      console.log('Items Count:', approvalData.items.length);

      // Check if we should use existing customer ID from submission
      const ocrData = await documentService.getOcrData(id);
      const useExistingCustomerId = ocrData?.normalized_ocr_json?.customerMatching?.existingCustomerId;

      // Find or create customer
      let customerId = null;
      
      if (useExistingCustomerId) {
        // Use the customer ID selected during review
        customerId = useExistingCustomerId;
        console.log('\n--- Using Existing Customer (from review) ---');
        console.log('Customer ID:', customerId);
      } else if (approvalData.customer.phone) {
        const customerResult = await client.query(
          'SELECT id FROM customers WHERE phone = $1',
          [approvalData.customer.phone]
        );
        console.log('\n--- Customer Lookup ---');
        console.log('Phone:', approvalData.customer.phone);
        console.log('Found:', customerResult.rows.length > 0);

        if (customerResult.rows.length > 0) {
          customerId = customerResult.rows[0].id;
          console.log('Existing Customer ID:', customerId);
        } else {
          const newCustomer = await client.query(
            `INSERT INTO customers (name, phone, email, gstin, address)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
              approvalData.customer.name,
              approvalData.customer.phone,
              approvalData.customer.email,
              approvalData.customer.gstin,
              approvalData.customer.address
            ]
          );
          customerId = newCustomer.rows[0].id;
          console.log('New Customer Created - ID:', customerId);
          console.log('Customer Row:', JSON.stringify(newCustomer.rows[0], null, 2));
        }
      }

      // Update invoice status
      const invoiceUpdate = await client.query(
        `UPDATE invoices 
         SET status = $1, customer_id = $2, approved_by = $3, approved_at = NOW()
         WHERE id = $4
         RETURNING id, invoice_number, status`,
        ['APPROVED', customerId, userId, id]
      );
      console.log('\n--- Invoice Updated ---');
      console.log('Result:', JSON.stringify(invoiceUpdate.rows[0], null, 2));

      // Delete existing invoice items
      const deleteResult = await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
      console.log('\n--- Deleted Old Invoice Items ---');
      console.log('Rows Deleted:', deleteResult.rowCount);

      // Insert line items
      console.log('\n--- Processing Line Items ---');
      for (let i = 0; i < approvalData.items.length; i++) {
        const item = approvalData.items[i];
        console.log(`\nItem ${i + 1}:`, JSON.stringify(item, null, 2));
        
        // Find or create product within the same transaction
        let productId = null;
        const productName = item.name || item.description; // Use description as fallback
        
        if (productName) {
          // Check for product by name only
          const productResult = await client.query(
            'SELECT id FROM products WHERE name = $1',
            [productName]
          );
          console.log(`  Product Lookup (name="${productName}"):`, productResult.rows.length > 0 ? 'FOUND' : 'NOT FOUND');

          if (productResult.rows.length > 0) {
            productId = productResult.rows[0].id;
            console.log('  Using Existing Product ID:', productId);
          } else {
            // Create new product
            const newProduct = await client.query(
              `INSERT INTO products (name, standard_price, created_at)
               VALUES ($1, $2, NOW())
               RETURNING id, name, standard_price, created_at`,
              [productName, item.unit_price || 0]
            );
            productId = newProduct.rows[0].id;
            console.log('  ✅ NEW PRODUCT CREATED:', JSON.stringify(newProduct.rows[0], null, 2));
          }
        }

        // Insert invoice item
        const invoiceItemResult = await client.query(
          `INSERT INTO invoice_items 
           (invoice_id, product_id, description, quantity, unit_price, tax_percentage, line_total, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, product_id, description, quantity, unit_price, line_total`,
          [id, productId, item.description || item.name, item.quantity || 0, item.unit_price || 0, 
           item.tax_percentage || 0, item.line_total || 0, i + 1]
        );
        console.log('  ✅ INVOICE ITEM CREATED:', JSON.stringify(invoiceItemResult.rows[0], null, 2));
      }

      await client.query('COMMIT');
      console.log('\n========== ✅ TRANSACTION COMMITTED ==========\n');

      // Log audit with comprehensive details
      const approverResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const approverName = approverResult.rows[0]?.name || 'Manager';
      
      await auditService.log({
        invoiceId: id,
        userId,
        action: 'INVOICE_APPROVED',
        details: auditHelper.createInvoiceAuditDetails('INVOICE_APPROVED', {
          invoiceNumber: invoice.invoice_number,
          totalAmount: invoice.total_amount,
          approverName: approverName
        })
      });

      // Invalidate analytics cache since invoice data changed
      invalidateAnalyticsCache();

      res.json({
        success: true,
        message: 'Invoice approved successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Approve invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve invoice'
    });
  }
};

exports.rejectInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const pool = getPostgresPool();

    // Check invoice status
    const invoiceCheck = await pool.query(
      'SELECT status FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoiceCheck.rows[0].status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not pending approval'
      });
    }

    // Update status to PENDING_REVIEW with rejection reason
    await pool.query(
      `UPDATE invoices 
       SET status = $1, rejection_reason = $2
       WHERE id = $3`,
      ['PENDING_REVIEW', reason, id]
    );

    // Log audit with comprehensive details
    const rejecterResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const rejecterName = rejecterResult.rows[0]?.name || 'Manager';
    
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'INVOICE_REJECTED',
      details: auditHelper.createInvoiceAuditDetails('INVOICE_REJECTED', {
        rejectedBy: rejecterName,
        reason: reason
      })
    });

    // Invalidate analytics cache (rejected invoices affect pending counts)
    invalidateAnalyticsCache();

    res.json({
      success: true,
      message: 'Invoice rejected'
    });
  } catch (error) {
    console.error('Reject invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject invoice'
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const pool = getPostgresPool();

    // Check invoice status and ownership
    const invoiceCheck = await pool.query(
      'SELECT id, status, created_by, invoice_number FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const invoice = invoiceCheck.rows[0];

    // OWNER can delete any invoice regardless of status
    // STAFF can only delete their own PENDING_REVIEW invoices
    if (userRole === 'STAFF') {
      if (invoice.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own invoices'
        });
      }
      if (invoice.status !== 'PENDING_REVIEW') {
        return res.status(400).json({
          success: false,
          message: 'You can only delete invoices in PENDING_REVIEW status'
        });
      }
    }

    console.log('\n========== DELETING INVOICE ==========');
    console.log('Invoice ID:', id);
    console.log('Invoice Number:', invoice.invoice_number);
    console.log('Deleted By User ID:', userId);

    // Delete from MongoDB (documents and OCR data)
    try {
      await documentService.deleteInvoiceDocuments(id);
      console.log('✅ MongoDB documents deleted');
    } catch (mongoError) {
      console.error('⚠️ MongoDB deletion error:', mongoError.message);
      // Continue with SQL deletion even if MongoDB fails
    }

    // Update audit log to remove invoice reference (preserve audit trail)
    const auditUpdateResult = await pool.query(
      'UPDATE audit_log SET invoice_id = NULL WHERE invoice_id = $1',
      [id]
    );
    console.log('✅ Audit log updated, rows affected:', auditUpdateResult.rowCount);

    // Delete from PostgreSQL (invoice record - cascade will handle invoice_items)
    const deleteResult = await pool.query(
      'DELETE FROM invoices WHERE id = $1',
      [id]
    );
    console.log('✅ PostgreSQL invoice deleted, rows affected:', deleteResult.rowCount);

    // Log audit with comprehensive deletion details
    await auditService.log({
      invoiceId: null, // Invoice is deleted, so no invoice_id
      userId,
      action: 'INVOICE_DELETED',
      details: `Invoice #${invoice.invoice_number} deleted, Amount: ₹${parseFloat(invoice.total_amount).toLocaleString('en-IN')}`
    });

    console.log('========== INVOICE DELETION COMPLETE ==========\n');

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice'
    });
  }
};

exports.generatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const pool = getPostgresPool();

    // Fetch invoice with authorization check
    const invoiceResult = await pool.query(
      `SELECT i.*, 
        c.name as customer_name, c.phone as customer_phone, 
        c.email as customer_email, c.gstin as customer_gstin, 
        c.address as customer_address
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied'
      });
    }

    const invoice = invoiceResult.rows[0];

    if (invoice.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only approved invoices can generate PDF'
      });
    }

    // Get invoice items
    const itemsResult = await pool.query(
      `SELECT ii.*, p.name as product_name
       FROM invoice_items ii
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = $1
       ORDER BY ii.id`,
      [id]
    );

    const items = itemsResult.rows;

    // Validate items exist
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice has no items'
      });
    }

    // Helper function for currency formatting
    const formatCurrency = (amount) => {
      const numAmount = parseFloat(amount || 0);
      return 'Rs. ' + new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numAmount);
    };

    // Create PDF with streaming
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      try {
        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('TAX INVOICE', { align: 'center' });
        doc.moveDown(1.5);

        // Invoice details section
        doc.fontSize(11).font('Helvetica');
        const leftColumn = 50;
        let currentY = doc.y;

        doc.text(`Invoice Number: ${invoice.invoice_number || 'N/A'}`, leftColumn, currentY);
        doc.text(`Date: ${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : 'N/A'}`, leftColumn);
        doc.text(`Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A'}`, leftColumn);
        
        doc.moveDown(2);

        // Customer details
        if (invoice.customer_name) {
          doc.fontSize(13)
             .font('Helvetica-Bold')
             .text('Bill To:', { underline: true });
          doc.moveDown(0.3);
          
          doc.fontSize(11).font('Helvetica');
          doc.text(invoice.customer_name);
          if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`);
          if (invoice.customer_email) doc.text(`Email: ${invoice.customer_email}`);
          if (invoice.customer_gstin) doc.text(`GSTIN: ${invoice.customer_gstin}`);
          if (invoice.customer_address) {
            doc.text('Address:', { continued: false });
            doc.text(invoice.customer_address, { width: 300, lineGap: 2 });
          }
          doc.moveDown(1.5);
        }

        // Items table
        doc.fontSize(13)
           .font('Helvetica-Bold')
           .text('Items:', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 320;
        const priceX = 400;
        const totalX = 480;
        const pageHeight = doc.page.height - doc.page.margins.bottom;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', itemX, tableTop);
        doc.text('Qty', qtyX, tableTop, { width: 70, align: 'right' });
        doc.text('Price', priceX, tableTop, { width: 70, align: 'right' });
        doc.text('Total', totalX, tableTop, { width: 70, align: 'right' });
        
        // Header underline
        const headerBottom = tableTop + 15;
        doc.moveTo(itemX, headerBottom)
           .lineTo(totalX + 70, headerBottom)
           .stroke();

        // Table rows
        doc.font('Helvetica').fontSize(10);
        let y = headerBottom + 10;
        
        items.forEach((item, index) => {
          // Check if we need a new page
          if (y > pageHeight - 150) {
            doc.addPage();
            y = 50;
            
            // Redraw header on new page
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Item', itemX, y);
            doc.text('Qty', qtyX, y, { width: 70, align: 'right' });
            doc.text('Price', priceX, y, { width: 70, align: 'right' });
            doc.text('Total', totalX, y, { width: 70, align: 'right' });
            
            const newHeaderBottom = y + 15;
            doc.moveTo(itemX, newHeaderBottom)
               .lineTo(totalX + 70, newHeaderBottom)
               .stroke();
            
            y = newHeaderBottom + 10;
            doc.font('Helvetica').fontSize(10);
          }
          
          // Item details with safe parsing
          const productName = item.product_name || item.description || 'Unnamed Product';
          const quantity = parseFloat(item.quantity || 0);
          const unitPrice = parseFloat(item.unit_price || 0);
          const lineTotal = parseFloat(item.line_total || 0);
          
          // Handle long product names
          const maxWidth = 260;
          if (productName.length > 40) {
            doc.text(productName.substring(0, 37) + '...', itemX, y, { width: maxWidth });
          } else {
            doc.text(productName, itemX, y, { width: maxWidth });
          }
          
          doc.text(quantity.toString(), qtyX, y, { width: 70, align: 'right' });
          doc.text(formatCurrency(unitPrice), priceX, y, { width: 70, align: 'right' });
          doc.text(formatCurrency(lineTotal), totalX, y, { width: 70, align: 'right' });
          
          y += 20;
        });

        // Bottom line after items
        doc.moveTo(itemX, y)
           .lineTo(totalX + 70, y)
           .stroke();
        
        y += 15;

        // Totals section
        doc.fontSize(11).font('Helvetica');
        const totalsLabelX = 400;
        const totalsValueX = 480;
        
        const subtotal = parseFloat(invoice.subtotal || 0);
        if (subtotal > 0) {
          doc.text('Subtotal:', totalsLabelX, y);
          doc.text(formatCurrency(subtotal), totalsValueX, y, { 
            width: 70, 
            align: 'right' 
          });
          y += 20;
        }
        
        const taxAmount = parseFloat(invoice.tax_amount || 0);
        if (taxAmount > 0) {
          doc.text('Tax:', totalsLabelX, y);
          doc.text(formatCurrency(taxAmount), totalsValueX, y, { 
            width: 70, 
            align: 'right' 
          });
          y += 20;
        }
        
        // Total amount with emphasis
        const totalAmount = parseFloat(invoice.total_amount || 0);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total Amount:', totalsLabelX, y);
        doc.text(formatCurrency(totalAmount), totalsValueX, y, { 
          width: 70, 
          align: 'right' 
        });

        // Footer
        doc.fontSize(9)
           .font('Helvetica')
           .moveDown(3);
        doc.text('Thank you for your business!', { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString('en-IN', {
          day: 'numeric',
          month: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        })}`, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    const pdfBuffer = Buffer.concat(chunks);
    
    // Store PDF in MongoDB
    const documentId = await documentService.storeDocument({
      invoiceId: id,
      documentType: 'GENERATED_PDF',
      fileName: `invoice_${invoice.invoice_number || 'unknown'}.pdf`,
      contentType: 'application/pdf',
      fileData: pdfBuffer,
      position: null,
      uploadedBy: userId
    });

    // Update invoice with PDF reference in transaction
    await pool.query(
      `UPDATE invoices 
       SET generated_pdf_document_id = $1, generated_pdf_timestamp = NOW()
       WHERE id = $2 AND status = 'APPROVED'`,
      [documentId, id]
    );

    // Log audit with comprehensive details
    const invoiceForAudit = await pool.query('SELECT invoice_number FROM invoices WHERE id = $1', [id]);
    
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'PDF_GENERATED',
      details: auditHelper.createInvoiceAuditDetails('PDF_GENERATED', {
        invoiceNumber: invoiceForAudit.rows[0]?.invoice_number
      })
    });

    res.json({
      success: true,
      message: 'PDF generated successfully',
      documentId
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.set({
      'Content-Type': document.content_type,
      'Content-Disposition': `attachment; filename="${document.file_name}"`
    });

    res.send(document.file_data.buffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
};

exports.matchCustomer = async (req, res) => {
  try {
    const { phone, name } = req.body;
    const pool = getPostgresPool();

    // Validate input
    if (!phone && !name) {
      return res.status(400).json({
        success: false,
        message: 'Phone or name is required for matching'
      });
    }

    let matchType = 'none';
    let customer = null;
    let suggestions = [];
    let confidence = 'none';

    // Step 1: Exact phone match (primary)
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      
      if (normalizedPhone) {
        const exactMatchResult = await pool.query(
          `SELECT c.*, 
            COUNT(i.id) as invoice_count,
            COALESCE(SUM(i.total_amount), 0) as lifetime_value,
            MAX(i.invoice_date) as last_purchase
           FROM customers c
           LEFT JOIN invoices i ON i.customer_id = c.id AND i.status = 'APPROVED'
           WHERE c.phone = $1
           GROUP BY c.id`,
          [normalizedPhone]
        );

        if (exactMatchResult.rows.length > 0) {
          customer = exactMatchResult.rows[0];
          matchType = 'exact';
          confidence = 'high';
          
          return res.json({
            success: true,
            matchType,
            customer,
            suggestions: [],
            confidence
          });
        }
      }
    }

    // Step 2: Fuzzy name match (fallback)
    if (name && name.trim().length >= 3) {
      const fuzzyMatchResult = await pool.query(
        `SELECT c.*, 
          similarity(c.name, $1) as similarity_score,
          COUNT(i.id) as invoice_count,
          COALESCE(SUM(i.total_amount), 0) as lifetime_value,
          MAX(i.invoice_date) as last_purchase
         FROM customers c
         LEFT JOIN invoices i ON i.customer_id = c.id AND i.status = 'APPROVED'
         WHERE similarity(c.name, $1) > 0.5
         GROUP BY c.id
         ORDER BY similarity_score DESC
         LIMIT 5`,
        [name.trim()]
      );

      if (fuzzyMatchResult.rows.length > 0) {
        suggestions = fuzzyMatchResult.rows.map(row => ({
          ...row,
          similarity_score: parseFloat(row.similarity_score).toFixed(2)
        }));
        matchType = 'fuzzy';
        confidence = suggestions[0].similarity_score > 0.7 ? 'medium' : 'low';
      }
    }

    res.json({
      success: true,
      matchType,
      customer,
      suggestions,
      confidence
    });
  } catch (error) {
    console.error('Match customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to match customer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Feature 3: Check for duplicate invoices
exports.checkDuplicateInvoice = async (req, res) => {
  try {
    const { customer_id, total_amount, invoice_date, invoice_number } = req.body;
    const pool = getPostgresPool();

    if (!customer_id || !total_amount || !invoice_date) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, total amount, and invoice date are required'
      });
    }

    // Calculate date range (±30 days)
    const selectedDate = new Date(invoice_date);
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 30);

    // Build query for duplicate detection
    let query = `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE (
        (i.customer_id = $1 
         AND i.total_amount = $2 
         AND i.invoice_date BETWEEN $3 AND $4)
    `;
    
    const params = [customer_id, total_amount, startDate, endDate];
    
    // Add invoice number check if provided
    if (invoice_number && invoice_number.trim() !== '') {
      query += ` OR (i.invoice_number = $5 AND i.invoice_number IS NOT NULL)`;
      params.push(invoice_number.trim());
    }
    
    query += `) AND i.status IN ('PENDING_APPROVAL', 'APPROVED') ORDER BY i.invoice_date DESC LIMIT 5`;

    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      // Calculate days difference for each match
      const duplicates = result.rows.map(row => {
        const invoiceDate = new Date(row.invoice_date);
        const daysDiff = Math.abs(Math.floor((selectedDate - invoiceDate) / (1000 * 60 * 60 * 24)));
        
        return {
          ...row,
          days_ago: daysDiff
        };
      });

      res.json({
        success: true,
        hasDuplicates: true,
        duplicates
      });
    } else {
      res.json({
        success: true,
        hasDuplicates: false,
        duplicates: []
      });
    }
  } catch (error) {
    console.error('Check duplicate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check for duplicate invoices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Feature 3: Log duplicate ignore action in audit log
exports.logDuplicateIgnored = async (req, res) => {
  try {
    const { invoice_id, matched_invoice_id } = req.body;
    const userId = req.user.userId;

    await auditService.log({
      invoiceId: invoice_id,
      userId: userId,
      action: 'DUPLICATE_IGNORED',
      details: `Duplicate invoice ignored, matched with invoice ID: ${matched_invoice_id}`
    });

    res.json({
      success: true,
      message: 'Duplicate ignore action logged'
    });
  } catch (error) {
    console.error('Log duplicate ignored error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log action'
    });
  }
};

