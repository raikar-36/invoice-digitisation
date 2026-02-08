const { getPostgresPool } = require('../config/database');

const createTables = async () => {
  const pool = getPostgresPool();
  
  try {
    // Enable pg_trgm extension for fuzzy text matching
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    console.log('✓ pg_trgm extension enabled');

    // Create USERS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'STAFF', 'ACCOUNTANT')),
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `);

    // Create CUSTOMERS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        gstin VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create GIN indexes for fuzzy matching on customers
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_name_trgm 
      ON customers USING gin(name gin_trgm_ops)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm 
      ON customers USING gin(phone gin_trgm_ops)
    `);
    console.log('✓ Customer fuzzy matching indexes created');

    // Create PRODUCTS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        hsn VARCHAR(20),
        standard_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create INVOICES table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL,
        invoice_date DATE NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2),
        discount_amount DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'INR',
        status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
        customer_id INTEGER REFERENCES customers(id),
        created_by INTEGER NOT NULL REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        submitted_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        submitted_at TIMESTAMP,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        generated_pdf_document_id VARCHAR(255),
        generated_pdf_timestamp TIMESTAMP
      )
    `);

    // Create INVOICE_ITEMS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        description TEXT,
        quantity DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        tax_percentage DECIMAL(5,2),
        line_total DECIMAL(10,2) NOT NULL,
        position INTEGER NOT NULL
      )
    `);

    // Create AUDIT_LOG table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        details JSONB
      )
    `);

    console.log('✓ Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = { createTables };
