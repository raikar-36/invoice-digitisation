require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDocuments() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(); // Use default DB from URI
    
    console.log('Connected to database:', db.databaseName);
    
    const documents = await db.collection('documents')
      .find({}, { projection: { invoice_id: 1, file_name: 1, document_id: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
    
    console.log('\n=== MongoDB Documents ===');
    documents.forEach(doc => {
      console.log(`Invoice ID: ${doc.invoice_id} | File: ${doc.file_name} | Doc ID: ${doc.document_id}`);
    });
    
    console.log('\n=== Documents by Invoice ID ===');
    const byInvoice = await db.collection('documents')
      .aggregate([
        {
          $group: {
            _id: '$invoice_id',
            count: { $sum: 1 },
            files: { $push: { name: '$file_name', doc_id: '$document_id' } }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();
    
    byInvoice.forEach(group => {
      console.log(`\nInvoice ${group._id}: ${group.count} document(s)`);
      group.files.forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file.name} (${file.doc_id})`);
      });
    });
    
  } finally {
    await client.close();
  }
}

checkDocuments().catch(console.error);
