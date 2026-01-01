const { getPostgresPool } = require('../config/database');

exports.getAllCustomers = async (req, res) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT c.*, COUNT(i.id) as invoice_count, SUM(i.total_amount) as total_spent
       FROM customers c
       LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'APPROVED'
       GROUP BY c.id
       ORDER BY total_spent DESC NULLS LAST`
    );

    res.json({
      success: true,
      customers: result.rows
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customers'
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();

    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const invoicesResult = await pool.query(
      `SELECT id, invoice_number, invoice_date, total_amount, status
       FROM invoices
       WHERE customer_id = $1
       ORDER BY invoice_date DESC`,
      [id]
    );

    res.json({
      success: true,
      customer: customerResult.rows[0],
      invoices: invoicesResult.rows
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer'
    });
  }
};
