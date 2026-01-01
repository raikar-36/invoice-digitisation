const { getPostgresPool } = require('../config/database');

exports.getDashboardMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pool = getPostgresPool();

    // Default to current month if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        SUM(total_amount) as total_revenue,
        COUNT(*) as invoice_count,
        AVG(total_amount) as avg_value,
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/86400) as avg_approval_days
       FROM invoices
       WHERE status = 'APPROVED'
         AND approved_at >= $1
         AND approved_at <= $2`,
      [start, end]
    );

    res.json({
      success: true,
      metrics: result.rows[0]
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard metrics'
    });
  }
};

exports.getRevenueFlow = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT 
        DATE(approved_at) as date,
        SUM(total_amount) as daily_revenue,
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_hours_to_approve,
        COUNT(*) as invoice_count
       FROM invoices
       WHERE status = 'APPROVED'
         AND approved_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(approved_at)
       ORDER BY date`,
      []
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get revenue flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue flow'
    });
  }
};

exports.getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT 
        c.id, c.name, c.phone,
        SUM(i.total_amount) as total_spent,
        COUNT(i.id) as invoice_count,
        SUM(i.total_amount) * 100.0 / (
          SELECT SUM(total_amount) FROM invoices WHERE status = 'APPROVED'
        ) as revenue_percentage
       FROM customers c
       JOIN invoices i ON i.customer_id = c.id
       WHERE i.status = 'APPROVED'
       GROUP BY c.id, c.name, c.phone
       ORDER BY total_spent DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      customers: result.rows
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top customers'
    });
  }
};

exports.getProductPerformance = async (req, res) => {
  try {
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT 
        p.id, p.name, p.sku,
        SUM(ii.quantity) as total_quantity,
        SUM(ii.line_total) as total_revenue,
        COUNT(DISTINCT ii.invoice_id) as times_sold,
        AVG(ii.unit_price) as avg_price
       FROM products p
       JOIN invoice_items ii ON ii.product_id = p.id
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE i.status = 'APPROVED'
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_revenue DESC`
    );

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Get product performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product performance'
    });
  }
};

exports.getWeeklyPattern = async (req, res) => {
  try {
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT 
        TO_CHAR(created_at, 'Day') as day_name,
        EXTRACT(DOW FROM created_at) as day_number,
        COUNT(*) as invoice_count,
        AVG(total_amount) as avg_amount
       FROM invoices
       WHERE status = 'APPROVED'
       GROUP BY day_name, day_number
       ORDER BY day_number`
    );

    res.json({
      success: true,
      pattern: result.rows
    });
  } catch (error) {
    console.error('Get weekly pattern error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly pattern'
    });
  }
};

exports.getStatusDistribution = async (req, res) => {
  try {
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value
       FROM invoices
       GROUP BY status
       ORDER BY status`
    );

    res.json({
      success: true,
      distribution: result.rows
    });
  } catch (error) {
    console.error('Get status distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status distribution'
    });
  }
};
