const { getPostgresPool } = require('../config/database');
const documentService = require('../services/document.service');
const ocrService = require('../services/ocr.service');
const auditService = require('../services/audit.service');
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

    const pool = getPostgresPool();

    // Create invoice record (invoice_date will be updated from OCR)
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (invoice_number, invoice_date, total_amount, status, created_by, created_at)
       VALUES ($1, NOW(), $2, $3, $4, NOW())
       RETURNING id`,
      ['PENDING', 0, 'PENDING_REVIEW', userId]
    );

    const invoiceId = invoiceResult.rows[0].id;

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

    // Process OCR
    const { rawOcr, normalized } = await ocrService.processOcr(files);

    // Store OCR data
    await documentService.storeOcrData({
      invoiceId,
      rawOcrJson: rawOcr,
      normalizedOcrJson: normalized
    });

    // Update invoice with OCR extracted data
    if (normalized?.invoice) {
      await pool.query(
        `UPDATE invoices 
         SET invoice_number = COALESCE($1, invoice_number),
             invoice_date = COALESCE($2, invoice_date),
             total_amount = COALESCE($3, total_amount)
         WHERE id = $4`,
        [
          normalized.invoice.invoice_number || null,
          normalized.invoice.invoice_date || null,
          normalized.invoice.total_amount || null,
          invoiceId
        ]
      );
    }

    // Log audit
    await auditService.log({
      invoiceId,
      userId,
      action: 'INVOICE_UPLOADED',
      details: { file_count: files.length }
    });

    res.status(201).json({
      success: true,
      invoiceId,
      ocrData: normalized
    });
  } catch (error) {
    console.error('Upload invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload invoice'
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo, minAmount, maxAmount } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const pool = getPostgresPool();
    
    let query = `
      SELECT 
        i.id, i.invoice_number, i.invoice_date, i.total_amount, 
        i.status, i.created_at, i.generated_pdf_document_id,
        i.submitted_at, i.rejection_reason,
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

    // Apply filters first
    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }

    // Role-based filtering (only if no explicit status filter)
    if (!status && userRole === 'ACCOUNTANT') {
      // Accountants can only see approved invoices
      params.push('APPROVED');
      query += ` AND i.status = $${params.length}`;
    } else if (!status && userRole === 'STAFF') {
      // Staff can ONLY see their own invoices (all statuses)
      params.push(userId);
      query += ` AND i.created_by = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      query += ` AND i.invoice_date >= $${params.length}`;
    }

    if (dateTo) {
      params.push(dateTo);
      query += ` AND i.invoice_date <= $${params.length}`;
    }

    if (minAmount) {
      params.push(minAmount);
      query += ` AND i.total_amount >= $${params.length}`;
    }

    if (maxAmount) {
      params.push(maxAmount);
      query += ` AND i.total_amount <= $${params.length}`;
    }

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

    // Log audit
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'INVOICE_REVIEWED',
      details: { updated_fields: Object.keys(updateData) }
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
        invoiceData.invoice_date,
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
        items: items
      }
    });

    // Log audit
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'INVOICE_SUBMITTED',
      details: {}
    });

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

      // Find or create customer
      let customerId = null;
      if (approvalData.customer.phone) {
        const customerResult = await client.query(
          'SELECT id FROM customers WHERE phone = $1',
          [approvalData.customer.phone]
        );

        if (customerResult.rows.length > 0) {
          customerId = customerResult.rows[0].id;
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
        }
      }

      // Update invoice status
      await client.query(
        `UPDATE invoices 
         SET status = $1, customer_id = $2, approved_by = $3, approved_at = NOW()
         WHERE id = $4`,
        ['APPROVED', customerId, userId, id]
      );

      // Delete existing invoice items
      await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

      // Insert line items
      for (let i = 0; i < approvalData.items.length; i++) {
        const item = approvalData.items[i];
        
        // Find or create product within the same transaction
        let productId = null;
        if (item.name) {
          const productResult = await client.query(
            'SELECT id FROM products WHERE name = $1',
            [item.name]
          );

          if (productResult.rows.length > 0) {
            productId = productResult.rows[0].id;
          } else {
            // Create new product
            const newProduct = await client.query(
              `INSERT INTO products (name, standard_price, created_at)
               VALUES ($1, $2, NOW())
               RETURNING id`,
              [item.name, item.unit_price || 0]
            );
            productId = newProduct.rows[0].id;
          }
        }

        // Insert invoice item
        await client.query(
          `INSERT INTO invoice_items 
           (invoice_id, product_id, description, quantity, unit_price, tax_percentage, line_total, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, productId, item.description || item.name, item.quantity || 0, item.unit_price || 0, 
           item.tax_percentage || 0, item.line_total || 0, i + 1]
        );
      }

      await client.query('COMMIT');

      // Log audit
      await auditService.log({
        invoiceId: id,
        userId,
        action: 'INVOICE_APPROVED',
        details: { customer_id: customerId }
      });

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

    // Log audit
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'INVOICE_REJECTED',
      details: { reason }
    });

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
       JOIN products p ON ii.product_id = p.id
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

    // Log audit
    await auditService.log({
      invoiceId: id,
      userId,
      action: 'PDF_GENERATED',
      details: { document_id: documentId }
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
