const { getPostgresPool } = require('../config/database');
const { cache, invalidateAnalyticsCache, getCacheStats } = require('../utils/cacheManager');

// Comprehensive Analytics Endpoint with Momentum & Sparklines
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, year, preset } = req.query;
    const pool = getPostgresPool();

    // Calculate date ranges
    let start, end;
    const today = new Date();
    
    if (startDate && endDate) {
      // Custom date range
      start = startDate;
      end = endDate;
    } else if (preset) {
      // Preset ranges
      const days = parseInt(preset);
      if (days === 0) {
        // All time
        start = '1900-01-01';
        end = today.toISOString().split('T')[0];
      } else {
        // Last N days
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days);
        start = startDate.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
      }
    } else {
      // Default to last 30 days
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      start = startDate.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    }

    // Year for yearly charts (default to current year)
    const selectedYear = year ? parseInt(year) : today.getFullYear();

    // Create cache keys
    const cacheKeyKPI = `kpi_${start}_${end}`;
    const cacheKeyMomentum = `momentum_${start}_${end}`;
    const cacheKeySparkline = `sparkline_${start}_${end}`;
    const cacheKeyYearlyRevenue = `yearly_revenue_${selectedYear}`;
    const cacheKeyTopRevenue = `top_revenue_${start}_${end}`;
    const cacheKeyStatus = `status_${start}_${end}`;
    const cacheKeyOperational = `operational_${start}_${end}`;

    // Try to get cached data
    let kpis = cache.get(cacheKeyKPI);
    let momentum = cache.get(cacheKeyMomentum);
    let sparklineData = cache.get(cacheKeySparkline);
    let yearlyRevenue = cache.get(cacheKeyYearlyRevenue);
    let topCustomersByRevenue = cache.get(cacheKeyTopRevenue);
    let statusDistribution = cache.get(cacheKeyStatus);
    let operationalMetrics = cache.get(cacheKeyOperational);

    // 1. KPIs (Current Period)
    if (!kpis) {
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
        total_invoices: parseInt(revenueQuery.rows[0].total_invoices) || 0,
        total_revenue: parseFloat(revenueQuery.rows[0].total_revenue) || 0,
        unique_customers: parseInt(revenueQuery.rows[0].unique_customers) || 0,
        total_items_sold: parseInt(itemsQuery.rows[0].total_items_sold) || 0
      };
      cache.set(cacheKeyKPI, kpis, 300); // 5 min TTL
    }

    // 2. Momentum (Percentage change from previous period)
    if (!momentum) {
      // Calculate previous period
      const daysDiff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
      const prevStart = new Date(new Date(start).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const prevEnd = new Date(new Date(start).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const prevRevenueQuery = await pool.query(
        `SELECT 
          COUNT(DISTINCT id) as total_invoices,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(DISTINCT customer_id) as unique_customers
         FROM invoices
         WHERE status = 'APPROVED'
           AND invoice_date >= $1
           AND invoice_date <= $2`,
        [prevStart, prevEnd]
      );

      const prevItemsQuery = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0) as total_items_sold
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.id
         WHERE i.status = 'APPROVED'
           AND i.invoice_date >= $1
           AND i.invoice_date <= $2`,
        [prevStart, prevEnd]
      );

      const prevKpis = {
        invoices: parseFloat(prevRevenueQuery.rows[0].total_invoices) || 0,
        revenue: parseFloat(prevRevenueQuery.rows[0].total_revenue) || 0,
        customers: parseFloat(prevRevenueQuery.rows[0].unique_customers) || 0,
        items: parseFloat(prevItemsQuery.rows[0].total_items_sold) || 0
      };

      // Calculate percentage change
      momentum = {
        invoices: prevKpis.invoices > 0 ? parseFloat((((kpis.total_invoices - prevKpis.invoices) / prevKpis.invoices) * 100).toFixed(1)) : 0,
        revenue: prevKpis.revenue > 0 ? parseFloat((((kpis.total_revenue - prevKpis.revenue) / prevKpis.revenue) * 100).toFixed(1)) : 0,
        customers: prevKpis.customers > 0 ? parseFloat((((kpis.unique_customers - prevKpis.customers) / prevKpis.customers) * 100).toFixed(1)) : 0,
        items: prevKpis.items > 0 ? parseFloat((((kpis.total_items_sold - prevKpis.items) / prevKpis.items) * 100).toFixed(1)) : 0
      };
      cache.set(cacheKeyMomentum, momentum, 300); // 5 min TTL
    }

    // 3. Sparkline Data (Last 7 days mini trends - always last 7 days, not filtered)
    if (!sparklineData) {
      const sparklineQuery = await pool.query(
        `WITH days AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date as day
        )
        SELECT 
          TO_CHAR(d.day, 'MM/DD') as label,
          COALESCE(COUNT(i.id), 0) as invoices,
          COALESCE(SUM(i.total_amount), 0) as revenue,
          COALESCE(COUNT(DISTINCT i.customer_id), 0) as customers,
          COALESCE(SUM(ii.quantity), 0) as items
        FROM days d
        LEFT JOIN invoices i ON DATE(i.invoice_date) = d.day AND i.status = 'APPROVED'
        LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
        GROUP BY d.day
        ORDER BY d.day`
      );

      const rawData = sparklineQuery.rows;
      sparklineData = {
        revenue: rawData.map(row => ({ value: parseFloat(row.revenue) })),
        invoices: rawData.map(row => ({ value: parseInt(row.invoices) })),
        items: rawData.map(row => ({ value: parseInt(row.items) })),
        customers: rawData.map(row => ({ value: parseInt(row.customers) }))
      };
      cache.set(cacheKeySparkline, sparklineData, 300); // 5 min TTL
    }

    // 4. Yearly Revenue (12 months)
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
      yearlyRevenue = yearlyRevenueQuery.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue)
      }));
      cache.set(cacheKeyYearlyRevenue, yearlyRevenue, 600); // 10 min TTL
    }

    // 5. Top 5 Customers by Revenue (for leaderboard)
    if (!topCustomersByRevenue) {
      const topCustomersByRevenueQuery = await pool.query(
        `SELECT 
          c.id, 
          c.name,
          COALESCE(SUM(i.total_amount), 0) as value,
          COUNT(i.id) as count
         FROM customers c
         JOIN invoices i ON i.customer_id = c.id
         WHERE i.status = 'APPROVED'
           AND i.invoice_date >= $1
           AND i.invoice_date <= $2
         GROUP BY c.id, c.name
         ORDER BY value DESC
         LIMIT 5`,
        [start, end]
      );
      topCustomersByRevenue = topCustomersByRevenueQuery.rows.map(row => ({
        id: row.id,
        name: row.name,
        value: parseFloat(row.value),
        count: parseInt(row.count)
      }));
      cache.set(cacheKeyTopRevenue, topCustomersByRevenue, 300); // 5 min TTL
    }

    // 6. Status Distribution (for donut chart)
    if (!statusDistribution) {
      const statusQuery = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count
         FROM invoices
         WHERE invoice_date >= $1
           AND invoice_date <= $2
         GROUP BY status`,
        [start, end]
      );

      statusDistribution = {
        approved: parseInt(statusQuery.rows.find(r => r.status === 'APPROVED')?.count) || 0,
        pending_review: parseInt(statusQuery.rows.find(r => r.status === 'PENDING_REVIEW')?.count) || 0,
        pending_approval: parseInt(statusQuery.rows.find(r => r.status === 'PENDING_APPROVAL')?.count) || 0,
        rejected: parseInt(statusQuery.rows.find(r => r.status === 'REJECTED')?.count) || 0
      };
      cache.set(cacheKeyStatus, statusDistribution, 300); // 5 min TTL
    }

    // 7. Operational Metrics
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
        avgItemsPerInvoice: parseFloat(avgItemsQuery.rows[0]?.avg_items_per_invoice) || 0,
        busiestDay: busiestDayQuery.rows[0]?.day_name?.trim() || 'N/A',
        mostActiveCustomer: mostActiveQuery.rows[0]?.name || 'N/A'
      };
      cache.set(cacheKeyOperational, operationalMetrics, 300); // 5 min TTL
    }

    res.json({
      success: true,
      data: {
        kpis,
        momentum,
        sparklineData,
        yearlyRevenue,
        topCustomersByRevenue,
        statusDistribution,
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
      message: 'Failed to get analytics data',
      error: error.message
    });
  }
};

// Cache Management Endpoints
exports.clearCache = async (req, res) => {
  try {
    invalidateAnalyticsCache();
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};

exports.getCacheStats = async (req, res) => {
  try {
    const stats = getCacheStats();
    const keys = cache.keys();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        totalKeys: keys.length,
        keys: keys
      }
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats'
    });
  }
};
