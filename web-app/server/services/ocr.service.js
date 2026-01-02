const axios = require('axios');
const FormData = require('form-data');

exports.normalizeOcrResponse = (rawOcr) => {
  const normalized = {
    invoice: {
      invoice_number: rawOcr?.invoice_number || null,
      invoice_date: rawOcr?.invoice_date || null,
      total_amount: rawOcr?.total_amount || null,
      tax_amount: rawOcr?.tax_amount || null,
      discount_amount: rawOcr?.discount_amount || null,
      currency: rawOcr?.currency || 'INR'
    },
    customer: {
      name: rawOcr?.customer_name || null,
      phone: rawOcr?.customer_phone || null,
      email: rawOcr?.customer_email || null,
      gstin: rawOcr?.customer_gstin || null,
      address: rawOcr?.customer_address || null
    },
    items: [],
    raw: rawOcr || {}
  };

  // Normalize line items
  if (rawOcr?.line_items && Array.isArray(rawOcr.line_items)) {
    normalized.items = rawOcr.line_items.map(item => ({
      name: item?.item_name || null,
      description: item?.item_description || null,
      quantity: item?.item_quantity || null,
      unit_price: item?.item_price || null,
      tax_percentage: item?.item_tax_percentage || null,
      line_total: item?.item_total || null
    }));
  }

  return normalized;
};

exports.processOcr = async (files) => {
  try {
    const formData = new FormData();
    
    // Add all files to form data
    files.forEach(file => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    const response = await axios.post(
      process.env.OCR_SERVICE_URL,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: parseInt(process.env.OCR_TIMEOUT) || 30000
      }
    );

    const rawOcr = response.data;
    const normalized = this.normalizeOcrResponse(rawOcr);

    return { rawOcr, normalized };
  } catch (error) {
    console.error('❌ OCR Service Connection Failed:', error.message);
    
    // Re-throw the error so controller can handle it properly
    throw new Error(`OCR service connection failed: ${error.message}`);
  }
};

module.exports = exports;
