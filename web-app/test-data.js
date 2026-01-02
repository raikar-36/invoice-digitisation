const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URI,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('=== DIAGNOSTIC CHECK ===\n');
    
    // Check total approved invoices
    const r1 = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(DISTINCT customer_id) as with_customer,
        MIN(invoice_date) as earliest_date,
        MAX(invoice_date) as latest_date
      FROM invoices 
      WHERE status = 'APPROVED'
    `);
    console.log('1. Total Approved Invoices:', r1.rows[0]);
    
    // Check current month invoices
    const r2 = await pool.query(`
      SELECT COUNT(*) as count
      FROM invoices 
      WHERE status = 'APPROVED' 
        AND invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND invoice_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `);
    console.log('\n2. Current Month (Jan 2026) Invoices:', r2.rows[0]);
    
    // Check top customers with all-time filter
    const r3 = await pool.query(`
      SELECT 
        c.name, 
        COUNT(i.id) as invoice_count,
        SUM(i.total_amount) as total_revenue
      FROM customers c 
      JOIN invoices i ON i.customer_id = c.id 
      WHERE i.status = 'APPROVED'
        AND i.invoice_date >= '1900-01-01'
        AND i.invoice_date <= CURRENT_DATE
      GROUP BY c.name 
      ORDER BY invoice_count DESC 
      LIMIT 5
    `);
    console.log('\n3. Top 5 Customers (All Time):', r3.rows);
    
    // Check daily trend for current month
    const r4 = await pool.query(`
      SELECT 
        DATE(invoice_date) as date,
        COUNT(*) as count
      FROM invoices
      WHERE status = 'APPROVED'
        AND invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND invoice_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      GROUP BY DATE(invoice_date)
      ORDER BY date
    `);
    console.log('\n4. Daily Trend for Current Month:', r4.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
