require('dotenv').config();
const { Pool } = require('pg');

const updateSchema = async () => {
  // Check if DATABASE_URL uses SSL (Neon) or not (local)
  const useSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? {
      rejectUnauthorized: false
    } : false
  });
  
  try {
    console.log('🔧 Updating database schema...\n');

    // Enable pg_trgm extension for fuzzy text matching
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    console.log('✓ pg_trgm extension enabled');

    // Create GIN indexes for fuzzy matching on customers
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_name_trgm 
      ON customers USING gin(name gin_trgm_ops)
    `);
    console.log('✓ Customer name fuzzy matching index created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm 
      ON customers USING gin(phone gin_trgm_ops)
    `);
    console.log('✓ Customer phone fuzzy matching index created');

    console.log('\n✅ Schema update completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    await pool.end();
    process.exit(1);
  }
};

updateSchema();
