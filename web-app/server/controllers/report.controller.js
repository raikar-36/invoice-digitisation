const { getPostgresPool } = require('../config/database');
const NodeCache = require('node-cache');

// Initialize cache with TTL of 5 minutes for regular data and 10 minutes for yearly data
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Comprehensive Analytics Endpoint
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;
    const pool = getPostgresPool();

    // Calculate date range for date-based filters
    let start, end;
    const today = new Date();
    
    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      // Default to all time
      start = '1900-01-01';
      end = today.toISOString().split('T')[0];
    }

    // Year for yearly bar charts (default to current year)
    const selectedYear = year ? parseInt(year) : today.getFullYear();

    // Create cache keys
    const cacheKeyKPI = `kpi_${start}_${end}`;
    const cacheKeyYearlyCount = `yearly_count_${selectedYear}`;
    const cacheKeyYearlyRevenue = `yearly_revenue_${selectedYear}`;
    const cacheKeyTopCount = `top_count_${start}_${end}`;
    const cacheKeyTopRevenue = `top_revenue_${start}_${end}`;
    const cacheKeyOperational = `operational_${start}_${end}`;
    const cacheKeyDailyTrend = `daily_trend_${today.getFullYear()}_${today.getMonth() + 1}`;

    // Try to get cached data
    let kpis = cache.get(cacheKeyKPI);
    let yearlyInvoiceCount = cache.get(cacheKeyYearlyCount);
    let yearlyRevenue = cache.get(cacheKeyYearlyRevenue);
    let topCustomersByCount = cache.get(cacheKeyTopCount);
    let topCustomersByRevenue = cache.get(cacheKeyTopRevenue);
    let operationalMetrics = cache.get(cacheKeyOperational);
    let dailyTrend = cache.get(cacheKeyDailyTrend);

    // 1. KPIs (Date Range Filter - Default: All Time)
    if (!kpis) {
      // Separate query for revenue/invoices/customers to avoid JOIN duplication
      const revenueQuery = await pool.query(
        `SELECT 
          COUNT(DISTINCT id) as total_invoices,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(DISTINCT customer_id) as unique_customers
         FROM invoices
         WHERE status = 'APPROVED'
           AND invoice_date >= $1
           AND invoice_date <= $2`,
        [start, end]
      );

      // Separate query for items sold
      const itemsQuery = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0) as total_items_sold
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.id
         WHERE i.status = 'APPROVED'
           AND i.invoice_date >= $1
           AND i.invoice_date <= $2`,
        [start, end]
      );

      kpis = {
        ...revenueQuery.rows[0],
        total_items_sold: itemsQuery.rows[0].total_items_sold
      };
      cache.set(cacheKeyKPI, kpis);
    }

    // 2. Yearly Invoice Count (12 months bars with year filter)
    if (!yearlyInvoiceCount) {
      const yearlyCountQuery = await pool.query(
        `WITH months AS (
          SELECT generate_series(1, 12) as month_num
        )
        SELECT 
          TO_CHAR(TO_DATE(m.month_num::text, 'MM'), 'Mon') as month,
          m.month_num,
          COALESCE(COUNT(i.id), 0) as count
        FROM months m
        LEFT JOIN invoices i ON EXTRACT(MONTH FROM i.invoice_date) = m.month_num 
          AND EXTRACT(YEAR FROM i.invoice_date) = $1
          AND i.status = 'APPROVED'
        GROUP BY m.month_num
        ORDER BY m.month_num`,
        [selectedYear]
      );
      yearlyInvoiceCount = yearlyCountQuery.rows;
      cache.set(cacheKeyYearlyCount, yearlyInvoiceCount, 600); // 10 min TTL
    }

    // 3. Yearly Revenue (12 months bars with year filter)
    if (!yearlyRevenue) {
      const yearlyRevenueQuery = await pool.query(
        `WITH months AS (
          SELECT generate_series(1, 12) as month_num
        )
        SELECT 
          TO_CHAR(TO_DATE(m.month_num::text, 'MM'), 'Mon') as month,
          m.month_num,
          COALESCE(SUM(i.total_amount), 0) as revenue
        FROM months m
        LEFT JOIN invoices i ON EXTRACT(MONTH FROM i.invoice_date) = m.month_num 
          AND EXTRACT(YEAR FROM i.invoice_date) = $1
          AND i.status = 'APPROVED'
        GROUP BY m.month_num
        ORDER BY m.month_num`,
        [selectedYear]
      );
      yearlyRevenue = yearlyRevenueQuery.rows;
      cache.set(cacheKeyYearlyRevenue, yearlyRevenue, 600); // 10 min TTL
    }

    // 4. Top 10 Customers by Invoice Count - Pie Chart (Date Range Filter)
    if (!topCustomersByCount) {
      const topCustomersByCountQuery = await pool.query(
        `SELECT 
          c.id, 
          c.name,
          COUNT(i.id) as value
         FROM customers c
         JOIN invoices i ON i.customer_id = c.id
         WHERE i.status = 'APPROVED'
           AND i.invoice_date >= $1
           AND i.invoice_date <= $2
         GROUP BY c.id, c.name
         ORDER BY value DESC
         LIMIT 10`,
        [start, end]
      );
      topCustomersByCount = topCustomersByCountQuery.rows;
      cache.set(cacheKeyTopCount, topCustomersByCount);
    }

    // 5. Top 10 Customers by Revenue - Pie Chart (Date Range Filter)
    if (!topCustomersByRevenue) {
      const topCustomersByRevenueQuery = await pool.query(
        `SELECT 
          c.id, 
          c.name,
          COALESCE(SUM(i.total_amount), 0) as value
         FROM customers c
         JOIN invoices i ON i.customer_id = c.id
         WHERE i.status = 'APPROVED'
           AND i.invoice_date >= $1
           AND i.invoice_date <= $2
         GROUP BY c.id, c.name
         ORDER BY value DESC
         LIMIT 10`,
        [start, end]
      );
      topCustomersByRevenue = topCustomersByRevenueQuery.rows;
      cache.set(cacheKeyTopRevenue, topCustomersByRevenue);
    }

    // 6. Daily Invoice Trend (Current Month Only - No Filter)
    if (!dailyTrend) {
      const dailyTrendQuery = await pool.query(
        `SELECT 
          DATE(invoice_date) as date,
          COUNT(*) as count
         FROM invoices
         WHERE status = 'APPROVED'
           AND invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
           AND invoice_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
         GROUP BY DATE(invoice_date)
         ORDER BY date`
      );
      dailyTrend = dailyTrendQuery.rows;
      cache.set(cacheKeyDailyTrend, dailyTrend);
    }

    // 7. Operational Metrics (Date Range Filter)
    if (!operationalMetrics) {
      // Avg Items Per Invoice
      const avgItemsQuery = await pool.query(
        `SELECT 
          AVG(item_count) as avg_items_per_invoice
         FROM (
           SELECT ii.invoice_id, SUM(ii.quantity) as item_count
           FROM invoice_items ii
           JOIN invoices i ON ii.invoice_id = i.id
           WHERE i.status = 'APPROVED'
             AND i.invoice_date >= $1
             AND i.invoice_date <= $2
           GROUP BY ii.invoice_id
         ) subquery`,
        [start, end]
      );

      // Busiest Day
      const busiestDayQuery = await pool.query(
        `SELECT 
          TO_CHAR(invoice_date, 'Day') as day_name,
          COUNT(*) as count
         FROM invoices
         WHERE status = 'APPROVED'
           AND invoice_date >= $1
           AND invoice_date <= $2
         GROUP BY day_name, EXTRACT(DOW FROM invoice_date)
         ORDER BY count DESC
         LIMIT 1`,
        [start, end]
      );

      // Most Active Customer
      const mostActiveQuery = await pool.query(
        `SELECT 
          c.name,
          COUNT(i.id) as invoice_count
         FROM customers c
         JOIN invoices i ON i.customer_id = c.id
         WHERE i.status = 'APPROVED'
           AND i.invoice_date >= $1
           AND i.invoice_date <= $2
         GROUP BY c.name
         ORDER BY invoice_count DESC
         LIMIT 1`,
        [start, end]
      );

      operationalMetrics = {
        avgItemsPerInvoice: avgItemsQuery.rows[0]?.avg_items_per_invoice || 0,
        busiestDay: busiestDayQuery.rows[0]?.day_name?.trim() || 'N/A',
        mostActiveCustomer: mostActiveQuery.rows[0]?.name || 'N/A'
      };
      cache.set(cacheKeyOperational, operationalMetrics);
    }

    res.json({
      success: true,
      data: {
        kpis,
        yearlyInvoiceCount,
        yearlyRevenue,
        topCustomersByCount,
        topCustomersByRevenue,
        dailyTrend,
        operationalMetrics,
        filters: { 
          dateRange: { start, end },
          year: selectedYear 
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
};

// Clear cache endpoint (optional - for manual cache invalidation)
exports.clearCache = async (req, res) => {
  try {
    cache.flushAll();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};

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
         AND invoice_date >= $1
         AND invoice_date <= $2`,
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
        DATE(invoice_date) as date,
        SUM(total_amount) as daily_revenue,
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_hours_to_approve,
        COUNT(*) as invoice_count
       FROM invoices
       WHERE status = 'APPROVED'
         AND invoice_date >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(invoice_date)
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
