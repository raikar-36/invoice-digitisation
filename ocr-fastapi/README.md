# Invoice OCR Service

A FastAPI service with a **single endpoint** that intelligently processes invoices from PDFs and images using Google Gemini AI.

## Features

- **Single PDF** processing (automatically splits multi-page PDFs)
- **Single image** processing
- **Multiple images** processing (merges data intelligently)
- **Smart data merging** from multiple pages/images
- **Concurrent processing** for better performance
- **Structured JSON output** with line items

---

## Architecture

```
User uploads files
    ↓
┌───────────────────────────────────┐
│  Single Endpoint:                 │
│  POST /api/v1/process-invoice     │
└───────────────────────────────────┘
    ↓
Check number of files
    ↓
┌─────────────────────┬─────────────────────┐
│  1 File             │  Multiple Files     │
└─────────────────────┴─────────────────────┘
    ↓                      ↓
Is it PDF?              All must be images
    ↓                      ↓
┌───Yes──────────┐     Process each image
│ Convert to     │     with receipt-ocr
│ images (pages) │         ↓
│      ↓         │     Merge all results
│ Process each   │         ↓
│ page image     │     Return single JSON
│      ↓         │
│ Merge pages    │
└────────────────┘
    ↓
┌───No───────────┐
│ Single image   │
│ Process it     │
│ Return JSON    │
└────────────────┘
```

---

## Installation

### 1. System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

**Windows:**
Download poppler from [here](https://github.com/oschwartz10612/poppler-windows/releases/) and add to PATH.

### 2. Python Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file:

```bash
# Required - Get your key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
GEMINI_MODEL=gemini-2.5-flash  # or other Gemini models
```

---

## Running the Service

```bash
# Development mode (with auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

---
---

## API Usage
### Endpoint

**POST** `/api/v1/process-invoice`

### Request

**Content-Type:** `multipart/form-data`

**Parameters:**
- `files`: One or multiple files (PDF or images)

### Response

```json
{
  "customer_name": "string or null",
  "customer_address": "string or null",
  "customer_phone": "string or null",
  "customer_email": "string or null",
  "customer_gstin": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "string or null",
  "total_amount": 123.45,
  "tax_amount": 10.50,
  "discount_amount": 5.00,
  "currency": "INR",
  "line_items": [
    {
      "item_name": "Product Name",
      "item_description": "string or null",
      "item_quantity": 2,
      "item_price": 50.00,
      "item_tax_percentage": 18.0,
      "item_total": 100.00
    }
  ]
}
```

---
---

## Usage Examples
### 1. cURL - Single PDF

```bash
curl -X POST "http://localhost:8000/api/v1/process-invoice" \
  -F "files=@invoice.pdf"
```

### 2. cURL - Single Image

```bash
curl -X POST "http://localhost:8000/api/v1/process-invoice" \
  -F "files=@receipt.jpg"
```

### 3. cURL - Multiple Images

```bash
curl -X POST "http://localhost:8000/api/v1/process-invoice" \
  -F "files=@page1.jpg" \
  -F "files=@page2.jpg" \
  -F "files=@page3.jpg"
```

### 4. Python Client

```python
import requests

# Single file
url = "http://localhost:8000/api/v1/process-invoice"

with open("invoice.pdf", "rb") as f:
    files = {"files": ("invoice.pdf", f, "application/pdf")}
    response = requests.post(url, files=files)

print(response.json())

# Multiple files
with open("page1.jpg", "rb") as f1, open("page2.jpg", "rb") as f2:
    files = [
        ("files", ("page1.jpg", f1, "image/jpeg")),
        ("files", ("page2.jpg", f2, "image/jpeg"))
    ]
    response = requests.post(url, files=files)

print(response.json())
```

### 5. JavaScript (Browser)

```javascript
// Single file
const formData = new FormData();
const fileInput = document.querySelector('input[type="file"]');
formData.append('files', fileInput.files[0]);

const response = await fetch('http://localhost:8000/api/v1/process-invoice', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);

// Multiple files
const formData = new FormData();
const fileInput = document.querySelector('input[type="file"][multiple]');
for (const file of fileInput.files) {
  formData.append('files', file);
}

const response = await fetch('http://localhost:8000/api/v1/process-invoice', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

---

## Smart Data Merging

When processing multiple pages/images, the service intelligently merges data:

### Header Information
- **First non-null wins**: customer_name, customer_address, customer_phone, customer_email, customer_gstin, invoice_number, invoice_date
- Ensures consistent metadata across pages

### Numerical Values
- **Summed**: total_amount, tax_amount, discount_amount
- Useful for multi-page invoices with subtotals

### Line Items
- **Concatenated**: All line items from all pages
- Maintains complete item list with details (name, description, quantity, price, tax percentage, total)

### Currency
- **Most common**: Uses the currency that appears most frequently
- Defaults to "INR" if not detected
- Handles mixed-currency edge cases

---

## Supported File Types

### PDF
- Single-page PDFs
- Multi-page PDFs
- Any DPI (processed at 300 DPI)

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

---

## Configuration

### Gemini Model Selection

You can choose different Google Gemini models:

```bash
# Recommended (fast and accurate)
GEMINI_MODEL=gemini-2.0-flash-exp

# Alternative models
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MODEL=gemini-1.5-flash
```

### PDF Processing DPI

Edit the `pdf_to_images` function in `main.py`:

```python
async def pdf_to_images(pdf_path: str, dpi: int = 300):  # Change DPI here
    ...
```

**DPI Guidelines:**
- 150 DPI: Fast, lower quality
- 300 DPI: Recommended balance (default)
- 600 DPI: High quality, slower

---

## Troubleshooting

### Error: "poppler not found"

**Solution:** Install poppler system dependency (see Installation section)

### Error: "GEMINI_API_KEY not set or using placeholder"

**Solution:** Set your Gemini API key in `.env` file or environment variables

**Possible causes:**
- Image quality too poor
- Text not readable
- Invoice format not recognized

**Solutions:**
- Use higher quality images
- Ensure good lighting and contrast
- Try increasing PDF DPI setting

### Multiple files upload not working

**Solution:** Ensure all files are images when uploading multiple files. PDFs cannot be mixed with images in multi-file uploads.

---

---

## Performance Tips

1. **Use gemini-2.0-flash-exp** for fast and accurate processing
2. **Lower PDF DPI** (e.g., 200) for faster processing if quality allows
3. **Batch multiple pages** as images instead of separate requests
4. **Enable concurrent processing** (already implemented via asyncio)

---

## Cost Estimation (Google Gemini)

**Gemini 2.5 Flash (recommended):**
- Free tier available with rate limits
- Paid tier: Very cost-effective
- **~$0.001-0.01 per invoice** (varies by complexity)

**Gemini 1.5 Pro:**
- More expensive but higher quality
- **~$0.01-0.05 per invoice** (varies by complexity)

---

## Security Considerations

- **Temporary files** are created during processing and cleaned up automatically
- **API keys** should never be committed to version control
- Consider implementing **authentication** for production use
- Implement **rate limiting** to prevent abuse
- **Sensitive data** is sent to Google Gemini API - ensure compliance with data policies

---

## Licenseuses the following libraries:
- `receipt-ocr` - Check library license
- `FastAPI` - MIT License
- `pdf2image` - MIT License

---

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

## 📧 Support

For issues or questions, please open an issue on the repository.

---

**Happy Invoice Processing! 🎉**