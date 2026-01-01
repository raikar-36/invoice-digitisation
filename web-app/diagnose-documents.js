require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fixDocuments() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('documents');
    
    console.log('\n=== Current State ===');
    const docs = await collection.find({}).toArray();
    docs.forEach(doc => {
      console.log(`${doc.file_name} → invoice_id: ${doc.invoice_id}`);
    });
    
    // Fix based on filename patterns
    console.log('\n=== Suggested Fixes ===');
    
    // If test1.jpg should belong to invoice 1
    const test1 = docs.find(d => d.file_name === 'test1.jpg');
    if (test1 && test1.invoice_id !== '1') {
      console.log(`Fix: test1.jpg from invoice ${test1.invoice_id} → invoice 1`);
    }
    
    // If invoice-3.png should belong to invoice 3
    const inv3 = docs.find(d => d.file_name === 'invoice-3.png');
    if (inv3 && inv3.invoice_id !== '3') {
      console.log(`Fix: invoice-3.png from invoice ${inv3.invoice_id} → invoice 3`);
    }
    
    console.log('\n⚠️  Do NOT run automated fixes - check which invoice each file was actually uploaded with!');
    console.log('The issue is likely in the upload process assigning wrong IDs.');
    
  } finally {
    await client.close();
  }
}

fixDocuments().catch(console.error);
