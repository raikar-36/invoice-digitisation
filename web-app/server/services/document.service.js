const { getMongoDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.storeDocument = async ({ invoiceId, documentType, fileName, contentType, fileData, position = null, uploadedBy }) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('documents');

    const document = {
      document_id: uuidv4(),
      invoice_id: invoiceId.toString(),
      document_type: documentType,
      file_name: fileName,
      content_type: contentType,
      file_data: fileData,
      position: position,
      uploaded_by: uploadedBy,
      created_at: new Date()
    };

    await collection.insertOne(document);
    return document.document_id;
  } catch (error) {
    console.error('Store document error:', error);
    throw error;
  }
};

exports.getDocumentsByInvoice = async (invoiceId, documentType = null) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('documents');

    const query = { invoice_id: invoiceId.toString() };
    if (documentType) {
      query.document_type = documentType;
    }

    const documents = await collection
      .find(query, { projection: { file_data: 0 } })
      .sort({ position: 1, created_at: 1 })
      .toArray();

    return documents;
  } catch (error) {
    console.error('Get documents error:', error);
    throw error;
  }
};

exports.getDocumentById = async (documentId) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('documents');

    const document = await collection.findOne({ document_id: documentId });
    return document;
  } catch (error) {
    console.error('Get document by ID error:', error);
    throw error;
  }
};

exports.deleteDocument = async (documentId) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('documents');

    await collection.deleteOne({ document_id: documentId });
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
};

exports.storeOcrData = async ({ invoiceId, rawOcrJson, normalizedOcrJson }) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('ocr_data');

    // Check if OCR data already exists for this invoice
    const existing = await collection.findOne({ invoice_id: invoiceId.toString() });

    if (existing) {
      // Update existing OCR data with reviewed form data
      await collection.updateOne(
        { invoice_id: invoiceId.toString() },
        {
          $set: {
            raw_ocr_json: rawOcrJson,
            normalized_ocr_json: normalizedOcrJson,
            updated_at: new Date()
          }
        }
      );
      return existing.document_id;
    } else {
      // Insert new OCR data
      const ocrData = {
        document_id: uuidv4(),
        invoice_id: invoiceId.toString(),
        raw_ocr_json: rawOcrJson,
        normalized_ocr_json: normalizedOcrJson,
        created_at: new Date()
      };

      await collection.insertOne(ocrData);
      return ocrData.document_id;
    }
  } catch (error) {
    console.error('Store OCR data error:', error);
    throw error;
  }
};

exports.getOcrData = async (invoiceId) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('ocr_data');

    // Get the most recent OCR data (in case there are duplicates, get the latest)
    const ocrData = await collection
      .find({ invoice_id: invoiceId.toString() })
      .sort({ updated_at: -1, created_at: -1 })
      .limit(1)
      .toArray();

    return ocrData.length > 0 ? ocrData[0] : null;
  } catch (error) {
    console.error('Get OCR data error:', error);
    throw error;
  }
};

exports.updateOcrData = async (invoiceId, normalizedOcrJson) => {
  try {
    const db = getMongoDb();
    const collection = db.collection('ocr_data');

    await collection.updateOne(
      { invoice_id: invoiceId.toString() },
      {
        $set: {
          normalized_ocr_json: normalizedOcrJson,
          updated_at: new Date()
        }
      }
    );
  } catch (error) {
    console.error('Update OCR data error:', error);
    throw error;
  }
};

exports.deleteInvoiceDocuments = async (invoiceId) => {
  try {
    const db = getMongoDb();
    
    // Delete all documents associated with the invoice
    const documentsCollection = db.collection('documents');
    const documentsResult = await documentsCollection.deleteMany({ 
      invoice_id: invoiceId.toString() 
    });
    console.log(`Deleted ${documentsResult.deletedCount} documents for invoice ${invoiceId}`);
    
    // Delete all OCR data associated with the invoice
    const ocrCollection = db.collection('ocr_data');
    const ocrResult = await ocrCollection.deleteMany({ 
      invoice_id: invoiceId.toString() 
    });
    console.log(`Deleted ${ocrResult.deletedCount} OCR records for invoice ${invoiceId}`);
    
    return {
      documents: documentsResult.deletedCount,
      ocrData: ocrResult.deletedCount
    };
  } catch (error) {
    console.error('Delete invoice documents error:', error);
    throw error;
  }
};

module.exports = exports;
