require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectMongoDB, connectPostgres, getPostgresPool } = require('./config/database');
const { createTables } = require('./config/schema');

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // Connect to databases
    await connectMongoDB();
    await connectPostgres();

    // Create tables
    await createTables();

    const pool = getPostgresPool();

    // Check if owner already exists
    const existingOwner = await pool.query(
      "SELECT id FROM users WHERE role = 'OWNER' LIMIT 1"
    );

    if (existingOwner.rows.length > 0) {
      console.log('✓ Owner user already exists');
      process.exit(0);
    }

    // Create initial owner user
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Admin Owner', 'owner@invoice.com', passwordHash, 'OWNER', 'ACTIVE']
    );

    console.log('✓ Created owner user:');
    console.log('  Email: owner@invoice.com');
    console.log('  Password: admin123');

    // Create sample staff user
    const staffPasswordHash = await bcrypt.hash('staff123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)`,
      ['John Staff', 'staff@invoice.com', staffPasswordHash, 'STAFF', 'ACTIVE']
    );

    console.log('✓ Created staff user:');
    console.log('  Email: staff@invoice.com');
    console.log('  Password: staff123');

    // Create sample accountant user
    const accountantPasswordHash = await bcrypt.hash('accountant123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Jane Accountant', 'accountant@invoice.com', accountantPasswordHash, 'ACCOUNTANT', 'ACTIVE']
    );

    console.log('✓ Created accountant user:');
    console.log('  Email: accountant@invoice.com');
    console.log('  Password: accountant123');

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
