/**
 * Utility functions for invoice filtering and sorting (client-side)
 */

/**
 * Filter invoices by creator
 * @param {Array} invoices - Array of invoice objects
 * @param {string|null} creatorFilter - Creator user ID, null for all, or 'all'
 * @param {number} currentUserId - Current logged-in user's ID
 * @returns {Array} Filtered invoices
 */
export const filterInvoicesByCreator = (invoices, creatorFilter, currentUserId) => {
  if (!creatorFilter || creatorFilter === 'all') {
    return invoices; // Show all invoices
  }
  
  // Filter by specific creator
  const creatorId = creatorFilter === 'my' ? currentUserId : parseInt(creatorFilter);
  return invoices.filter(invoice => invoice.created_by === creatorId);
};

/**
 * Sort invoices based on sort option
 * @param {Array} invoices - Array of invoice objects
 * @param {string} sortOption - Sort option key
 * @returns {Array} Sorted invoices (new array)
 */
export const sortInvoices = (invoices, sortOption) => {
  const sorted = [...invoices]; // Create copy to avoid mutation
  
  switch (sortOption) {
    case 'created_desc':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    case 'created_asc':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    case 'invoice_date_desc':
      return sorted.sort((a, b) => {
        const dateA = a.invoice_date ? new Date(a.invoice_date) : new Date(0);
        const dateB = b.invoice_date ? new Date(b.invoice_date) : new Date(0);
        return dateB - dateA;
      });
    
    case 'invoice_date_asc':
      return sorted.sort((a, b) => {
        const dateA = a.invoice_date ? new Date(a.invoice_date) : new Date(0);
        const dateB = b.invoice_date ? new Date(b.invoice_date) : new Date(0);
        return dateA - dateB;
      });
    
    case 'amount_desc':
      return sorted.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
    
    case 'amount_asc':
      return sorted.sort((a, b) => (a.total_amount || 0) - (b.total_amount || 0));
    
    case 'customer_asc':
      return sorted.sort((a, b) => {
        const nameA = (a.customer_name || '').toLowerCase();
        const nameB = (b.customer_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    
    case 'customer_desc':
      return sorted.sort((a, b) => {
        const nameA = (a.customer_name || '').toLowerCase();
        const nameB = (b.customer_name || '').toLowerCase();
        return nameB.localeCompare(nameA);
      });
    
    case 'invoice_number_asc':
      return sorted.sort((a, b) => {
        const numA = a.invoice_number || '';
        const numB = b.invoice_number || '';
        return numA.localeCompare(numB, undefined, { numeric: true });
      });
    
    case 'invoice_number_desc':
      return sorted.sort((a, b) => {
        const numA = a.invoice_number || '';
        const numB = b.invoice_number || '';
        return numB.localeCompare(numA, undefined, { numeric: true });
      });
    
    case 'status':
      // Status priority: PENDING_REVIEW > PENDING_APPROVAL > APPROVED > REJECTED
      const statusOrder = {
        'PENDING_REVIEW': 1,
        'PENDING_APPROVAL': 2,
        'APPROVED': 3,
        'REJECTED': 4
      };
      return sorted.sort((a, b) => {
        const orderA = statusOrder[a.status] || 999;
        const orderB = statusOrder[b.status] || 999;
        return orderA - orderB;
      });
    
    default:
      return sorted;
  }
};

/**
 * Get list of unique creators from invoices
 * @param {Array} invoices - Array of invoice objects
 * @returns {Array} Array of creator objects with id, name, and count
 */
export const getCreatorsFromInvoices = (invoices) => {
  const creatorsMap = new Map();
  
  invoices.forEach(invoice => {
    if (invoice.created_by && invoice.created_by_name) {
      if (creatorsMap.has(invoice.created_by)) {
        creatorsMap.get(invoice.created_by).count++;
      } else {
        creatorsMap.set(invoice.created_by, {
          id: invoice.created_by,
          name: invoice.created_by_name,
          count: 1
        });
      }
    }
  });
  
  return Array.from(creatorsMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
};
