/**
 * Helper functions for audit logging
 * Provides utilities to capture comprehensive audit details
 */

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
};

/**
 * Compare objects to get changed fields
 * @param {Object} oldObj - Original object
 * @param {Object} newObj - Updated object
 * @returns {Array|null} - Array of change descriptions or null
 */
exports.getChangedFields = (oldObj, newObj) => {
  const changes = [];
  
  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {})
  ]);
  
  for (const key of allKeys) {
    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];
    
    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }
    
    // Format the field name (convert snake_case to readable)
    const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Better formatting for different value types
    let oldDisplay = oldValue;
    let newDisplay = newValue;
    
    if (oldValue === null || oldValue === undefined || oldValue === '') {
      oldDisplay = 'empty';
    } else if (typeof oldValue === 'object') {
      oldDisplay = Array.isArray(oldValue) ? `[${oldValue.length} items]` : '[object]';
    }
    
    if (newValue === null || newValue === undefined || newValue === '') {
      newDisplay = 'empty';
    } else if (typeof newValue === 'object') {
      newDisplay = Array.isArray(newValue) ? `[${newValue.length} items]` : '[object]';
    }
    
    changes.push(`${fieldName}: ${oldDisplay} → ${newDisplay}`);
  }
  
  return changes.length > 0 ? changes : null;
};

/**
 * Create comprehensive audit details for invoice actions
 * @param {string} action - Action being performed
 * @param {Object} params - Action-specific parameters
 * @returns {string} - Human-readable audit details
 */
exports.createInvoiceAuditDetails = (action, params = {}) => {
  switch (action) {
    case 'INVOICE_UPLOADED':
      const amount = formatCurrency(params.totalAmount);
      const invoiceNum = params.invoiceNumber || 'Unknown';
      const userName = params.userName || 'User';
      const customer = params.customerName || 'Unknown Customer';
      return `Invoice #${invoiceNum} uploaded by ${userName}, Amount: ${amount}, Customer: ${customer}`;
      
    case 'INVOICE_UPDATED':
      const fields = params.updatedFields || [];
      const changes = params.changes;
      if (changes && Array.isArray(changes) && changes.length > 0) {
        return changes.join(', ');
      }
      return `Updated fields: ${fields.join(', ')}`;
      
    case 'INVOICE_SUBMITTED':
      const submitAmount = formatCurrency(params.totalAmount);
      const submitInvoiceNum = params.invoiceNumber || 'Unknown';
      return `Invoice #${submitInvoiceNum} submitted for approval, Amount: ${submitAmount}`;
      
    case 'INVOICE_APPROVED':
      const approveAmount = formatCurrency(params.totalAmount);
      const approveInvoiceNum = params.invoiceNumber || 'Unknown';
      const approver = params.approverName || 'Manager';
      return `Invoice #${approveInvoiceNum} approved by ${approver}, Amount: ${approveAmount}`;
      
    case 'INVOICE_REJECTED':
      const rejecter = params.rejectedBy || 'Manager';
      const reason = params.reason || 'No reason provided';
      return `Rejected by: ${rejecter}, Reason: ${reason}`;
      
    case 'PDF_GENERATED':
      const pdfInvoiceNum = params.invoiceNumber || 'Unknown';
      return `PDF generated for Invoice #${pdfInvoiceNum}`;
      
    default:
      return JSON.stringify(params);
  }
};

/**
 * Create comprehensive audit details for user actions
 * @param {string} action - Action being performed
 * @param {Object} params - Action-specific parameters
 * @returns {string} - Human-readable audit details
 */
exports.createUserAuditDetails = (action, params = {}) => {
  switch (action) {
    case 'USER_CREATED':
      const email = params.email || 'unknown@email.com';
      const role = params.role || 'Unknown';
      const name = params.name || 'Unknown User';
      return `User: ${email}, Role: ${role}, Name: ${name}`;
      
    case 'USER_DEACTIVATED':
      const deactivatedEmail = params.email || 'unknown@email.com';
      const deactivatedName = params.name || 'Unknown User';
      return `User deactivated: ${deactivatedEmail} (${deactivatedName})`;
      
    case 'ROLE_CHANGED':
      const changedEmail = params.email || 'unknown@email.com';
      const changedName = params.name || 'Unknown User';
      const previousRole = params.previousRole || 'Unknown';
      const newRole = params.newRole || 'Unknown';
      return `${changedName} (${changedEmail}): ${previousRole} → ${newRole}`;
      
    default:
      return JSON.stringify(params);
  }
};

module.exports = exports;
