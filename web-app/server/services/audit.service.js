const { getPostgresPool } = require('../config/database');

exports.log = async ({ invoiceId = null, userId, action, details = {} }) => {
  try {
    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO audit_log (invoice_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [invoiceId, userId, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error - audit logging shouldn't break the main flow
  }
};

exports.getInvoiceAudit = async (invoiceId) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT 
        al.id, al.action, al.timestamp, al.details,
        u.name as user_name, u.email as user_email
       FROM audit_log al
       JOIN users u ON al.user_id = u.id
       WHERE al.invoice_id = $1
       ORDER BY al.timestamp DESC`,
      [invoiceId]
    );
    return result.rows;
  } catch (error) {
    console.error('Get invoice audit error:', error);
    throw error;
  }
};

exports.getAllAudit = async (filters = {}) => {
  try {
    const pool = getPostgresPool();
    let query = `
      SELECT 
        al.id, al.invoice_id, al.user_id, al.action, al.timestamp, al.details,
        u.name as user_name, u.email as user_email,
        i.invoice_number
      FROM audit_log al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN invoices i ON al.invoice_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.userId) {
      params.push(filters.userId);
      query += ` AND al.user_id = $${params.length}`;
    }
    
    if (filters.action) {
      params.push(filters.action);
      query += ` AND al.action = $${params.length}`;
    }
    
    if (filters.startDate) {
      params.push(filters.startDate);
      query += ` AND al.timestamp >= $${params.length}`;
    }
    
    if (filters.endDate) {
      params.push(filters.endDate);
      query += ` AND al.timestamp <= $${params.length}`;
    }
    
    query += ' ORDER BY al.timestamp DESC LIMIT 1000';
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Get all audit error:', error);
    throw error;
  }
};

module.exports = exports;
