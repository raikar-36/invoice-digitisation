const { MongoClient } = require('mongodb');
const { Pool } = require('pg');

let mongoClient;
let postgresPool;

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getMongoDb = () => {
  if (!mongoClient) {
    throw new Error('MongoDB not connected');
  }
  return mongoClient.db();
};

// PostgreSQL Connection
const connectPostgres = async () => {
  try {
    postgresPool = new Pool({
      connectionString: process.env.POSTGRES_URI,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection
    const client = await postgresPool.connect();
    console.log('✓ Connected to PostgreSQL');
    client.release();
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

const getPostgresPool = () => {
  if (!postgresPool) {
    throw new Error('PostgreSQL not connected');
  }
  return postgresPool;
};

module.exports = {
  connectMongoDB,
  connectPostgres,
  getMongoDb,
  getPostgresPool
};
