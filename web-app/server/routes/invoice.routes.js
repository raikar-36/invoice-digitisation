const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');

router.use(authenticate);

// Upload invoice
router.post('/upload', 
  authorize('OWNER', 'STAFF'),
  upload.array('files', 20),
  handleMulterError,
  invoiceController.uploadInvoice
);

// Get invoices with filtering
router.get('/', invoiceController.getInvoices);

// Get single invoice with details
router.get('/:id', invoiceController.getInvoiceById);

// Get invoice documents list
router.get('/:id/documents', invoiceController.getInvoiceDocuments);

// Get invoice OCR data
router.get('/:id/ocr', invoiceController.getInvoiceOcrData);

// Update invoice (review/edit)
router.put('/:id', authorize('OWNER', 'STAFF'), invoiceController.updateInvoice);

// Submit for approval
router.post('/:id/submit', authorize('OWNER', 'STAFF'), invoiceController.submitForApproval);

// Approve invoice
router.post('/:id/approve', authorize('OWNER'), invoiceController.approveInvoice);

// Reject invoice
router.post('/:id/reject', authorize('OWNER'), invoiceController.rejectInvoice);

// Delete invoice (only PENDING_REVIEW)
router.delete('/:id', authorize('OWNER', 'STAFF'), invoiceController.deleteInvoice);

// Match customer (search for duplicates)
router.post('/match-customer', authorize('OWNER', 'STAFF'), invoiceController.matchCustomer);

// Check for duplicate invoices
router.post('/check-duplicate', authorize('OWNER', 'STAFF'), invoiceController.checkDuplicateInvoice);

// Log duplicate ignored action
router.post('/log-duplicate-ignored', authorize('OWNER', 'STAFF'), invoiceController.logDuplicateIgnored);

// Generate PDF
router.post('/:id/generate-pdf', authorize('OWNER'), invoiceController.generatePdf);

// Download document
router.get('/:id/documents/:documentId', invoiceController.downloadDocument);

module.exports = router;
