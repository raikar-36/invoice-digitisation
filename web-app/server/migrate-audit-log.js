const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function migrateAuditLog() {
  try {
    console.log('🔄 Starting audit_log migration...');
    
    // Create pool with SSL for cloud database
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URI,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await pool.query('SELECT 1');
    
    // Check if column is JSONB
    const checkResult = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_log' AND column_name = 'details'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ audit_log table or details column not found');
      process.exit(1);
    }
    
    const currentType = checkResult.rows[0].data_type;
    console.log(`Current details column type: ${currentType}`);
    
    if (currentType === 'jsonb' || currentType === 'json') {
      console.log('🔧 Converting JSONB to TEXT...');
      
      // Alter column from JSONB to TEXT
      await pool.query(`
        ALTER TABLE audit_log 
        ALTER COLUMN details TYPE TEXT 
        USING details::TEXT
      `);
      
      console.log('✅ Successfully migrated details column from JSONB to TEXT');
    } else if (currentType === 'text') {
      console.log('✅ Column is already TEXT, no migration needed');
    } else {
      console.log(`⚠️  Unexpected column type: ${currentType}`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateAuditLog();
