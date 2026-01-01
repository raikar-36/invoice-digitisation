const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getMongoDb } = require('../config/database');

// Serve document by document_id
router.get('/:documentId', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    const mongodb = getMongoDb();
    const documentsCollection = mongodb.collection('documents');
    
    const document = await documentsCollection.findOne({ 
      document_id: documentId 
    });
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', document.content_type);
    res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // Send binary data
    res.send(document.file_data.buffer);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch document' 
    });
  }
});

module.exports = router;
