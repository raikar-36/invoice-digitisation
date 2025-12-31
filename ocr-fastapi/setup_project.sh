#!/bin/bash

# Invoice OCR Service - Project Setup Script
# This script creates the complete directory structure

echo "Setting up Invoice OCR Service project structure..."

# Create main directories
mkdir -p tests/test_samples/multi_page
mkdir -p docs
mkdir -p logs

# Create __init__.py files for Python packages
touch tests/__init__.py

# Create test files
cat > tests/test_api.py << 'EOF'
"""
Unit tests for Invoice OCR API
Run with: pytest tests/
"""

import pytest
from fastapi.testclient import TestClient
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_process_invoice_no_files():
    """Test API with no files uploaded"""
    response = client.post("/api/v1/process-invoice", files=[])
    assert response.status_code == 422  # Validation error


# Add more tests as needed
# def test_process_single_image():
#     """Test processing a single image"""
#     with open("tests/test_samples/sample_receipt.jpg", "rb") as f:
#         files = {"files": ("receipt.jpg", f, "image/jpeg")}
#         response = client.post("/api/v1/process-invoice", files=files)
#     assert response.status_code == 200
#     assert "merchant_name" in response.json()
EOF

# Create additional documentation files
cat > docs/API.md << 'EOF'
# API Documentation

## Endpoints

### Health Check
**GET** `/health`

Returns service health status.

### Process Invoice
**POST** `/api/v1/process-invoice`

Main endpoint for invoice processing.

See main README.md for detailed documentation.
EOF

cat > docs/DEPLOYMENT.md << 'EOF'
# Deployment Guide

## Docker Deployment

### Using Docker Compose (Recommended)

1. Create `.env` file with your API key
2. Run: `docker-compose up -d`
3. Access: http://localhost:8000

### Using Docker Directly

```bash
# Build
docker build -t invoice-ocr .

# Run
docker run -d \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your_key_here \
  --name invoice-ocr \
  invoice-ocr
```

## Cloud Deployment

### AWS ECS / Fargate
- Use provided Dockerfile
- Set environment variables in task definition
- Configure load balancer for port 8000

### Google Cloud Run
```bash
gcloud run deploy invoice-ocr \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances
```bash
az container create \
  --resource-group myResourceGroup \
  --name invoice-ocr \
  --image invoice-ocr:latest \
  --ports 8000
```
EOF

cat > docs/EXAMPLES.md << 'EOF'
# Usage Examples

## Python Examples

### Basic Usage
```python
import requests

url = "http://localhost:8000/api/v1/process-invoice"

# Single file
with open("invoice.pdf", "rb") as f:
    response = requests.post(url, files={"files": f})
    
print(response.json())
```

### Advanced Usage with Error Handling
```python
import requests
from typing import Optional, Dict, Any

def process_invoice(file_path: str) -> Optional[Dict[Any, Any]]:
    """Process invoice and return structured data"""
    url = "http://localhost:8000/api/v1/process-invoice"
    
    try:
        with open(file_path, "rb") as f:
            files = {"files": (file_path, f)}
            response = requests.post(url, files=files, timeout=60)
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Use it
data = process_invoice("invoice.pdf")
if data:
    print(f"Total: {data['currency']} {data['total_amount']}")
```

## JavaScript/TypeScript Examples

### Node.js
```javascript
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function processInvoice(filePath) {
  const form = new FormData();
  form.append('files', fs.createReadStream(filePath));
  
  const response = await axios.post(
    'http://localhost:8000/api/v1/process-invoice',
    form,
    { headers: form.getHeaders() }
  );
  
  return response.data;
}

processInvoice('./invoice.pdf')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### React Frontend
```typescript
import { useState } from 'react';

function InvoiceUploader() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/process-invoice', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileUpload} 
      />
      {loading && <p>Processing...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```
EOF

# Create sample test files README
cat > tests/test_samples/README.md << 'EOF'
# Test Samples

Place your test invoice files here:

- `sample_invoice.pdf` - Single page PDF invoice
- `sample_receipt.jpg` - Receipt image
- `multi_page/` - Directory for multi-page invoice images
  - `page1.jpg`
  - `page2.jpg`
  - `page3.jpg`

These files are for testing purposes only and are git-ignored.
EOF

# Create logs directory README
cat > logs/README.md << 'EOF'
# Logs Directory

Application logs will be stored here.

This directory is git-ignored.
EOF

# Create a simple pytest configuration
cat > pytest.ini << 'EOF'
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
EOF

# Create requirements-dev.txt for development dependencies
cat > requirements-dev.txt << 'EOF'
# Development dependencies
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
black==23.12.1
flake8==6.1.0
mypy==1.7.1

# Include main requirements
-r requirements.txt
EOF

echo ""
echo "Project structure created successfully!"
echo ""
echo "Directory structure:"
tree -L 2 -I '__pycache__|*.pyc|venv|env' || find . -type d -not -path '*/\.*' -not -path '*/venv/*' -not -path '*/__pycache__/*' | head -20

echo ""
echo "Next steps:"
echo "1. Copy environment variables:  cp .env.example .env"
echo "2. Edit .env and add your GEMINI_API_KEY"
echo "3. Create virtual environment: python -m venv venv"
echo "4. Activate it:                source venv/bin/activate"
echo "5. Install dependencies:       pip install -r requirements.txt"
echo "6. Run the service:            python main.py"
echo "7. Run tests (optional):       pip install -r requirements-dev.txt && pytest"
echo ""
echo "Add test samples to tests/test_samples/ for testing"
echo ""