# API Testing Guide

This guide shows how to test all API endpoints using curl or tools like Postman/Insomnia.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All endpoints except `/auth/login` require authentication via httpOnly cookie.

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@invoice.com",
    "password": "admin123"
  }' \
  -c cookies.txt

# Response:
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin Owner",
    "email": "owner@invoice.com",
    "role": "OWNER"
  }
}
```

### 2. Get Current User
```bash
curl http://localhost:5000/api/auth/me \
  -b cookies.txt

# Response:
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin Owner",
    "email": "owner@invoice.com",
    "role": "OWNER"
  }
}
```

### 3. Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt

# Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Management (Owner Only)

### 4. Get All Users
```bash
curl http://localhost:5000/api/users \
  -b cookies.txt

# Response:
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "Admin Owner",
      "email": "owner@invoice.com",
      "role": "OWNER",
      "status": "ACTIVE",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5. Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "New Staff Member",
    "email": "newstaff@invoice.com",
    "password": "password123",
    "role": "STAFF"
  }'

# Response:
{
  "success": true,
  "user": {
    "id": 4,
    "name": "New Staff Member",
    "email": "newstaff@invoice.com",
    "role": "STAFF",
    "status": "ACTIVE"
  }
}
```

### 6. Deactivate User
```bash
curl -X PATCH http://localhost:5000/api/users/4/deactivate \
  -b cookies.txt

# Response:
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### 7. Change User Role
```bash
curl -X PATCH http://localhost:5000/api/users/2/role \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "role": "ACCOUNTANT" }'

# Response:
{
  "success": true,
  "message": "User role updated successfully"
}
```

## Invoice Management

### 8. Upload Invoice
```bash
curl -X POST http://localhost:5000/api/invoices/upload \
  -b cookies.txt \
  -F "files=@/path/to/invoice1.jpg" \
  -F "files=@/path/to/invoice2.jpg"

# Response:
{
  "success": true,
  "invoiceId": 1,
  "ocrData": {
    "invoice": {
      "invoice_number": null,
      "invoice_date": null,
      "total_amount": null,
      "tax_amount": null,
      "discount_amount": null,
      "currency": "INR"
    },
    "customer": {
      "name": null,
      "phone": null,
      "email": null,
      "gstin": null,
      "address": null
    },
    "items": []
  }
}
```

### 9. Get All Invoices
```bash
# Without filters
curl http://localhost:5000/api/invoices \
  -b cookies.txt

# With filters
curl "http://localhost:5000/api/invoices?status=APPROVED&search=INV001&dateFrom=2026-01-01" \
  -b cookies.txt

# Response:
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV001",
      "invoice_date": "2026-01-15",
      "total_amount": "5000.00",
      "status": "APPROVED",
      "customer_name": "ABC Traders",
      "customer_phone": "9876543210",
      "created_by_name": "Admin Owner",
      "created_at": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

### 10. Get Invoice by ID
```bash
curl http://localhost:5000/api/invoices/1 \
  -b cookies.txt

# Response:
{
  "success": true,
  "invoice": {
    "id": 1,
    "invoice_number": "INV001",
    "invoice_date": "2026-01-15",
    "total_amount": "5000.00",
    "tax_amount": "900.00",
    "discount_amount": "0.00",
    "currency": "INR",
    "status": "APPROVED",
    "customer_name": "ABC Traders",
    "customer_phone": "9876543210",
    "items": [
      {
        "id": 1,
        "product_name": "Product A",
        "quantity": "2.00",
        "unit_price": "2050.00",
        "line_total": "4100.00"
      }
    ],
    "documents": [
      {
        "document_id": "uuid-here",
        "document_type": "ORIGINAL",
        "file_name": "invoice1.jpg",
        "position": 1
      }
    ]
  }
}
```

### 11. Update Invoice
```bash
curl -X PUT http://localhost:5000/api/invoices/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "invoice_number": "INV001-UPDATED",
    "invoice_date": "2026-01-15",
    "total_amount": 5500,
    "tax_amount": 900,
    "discount_amount": 0,
    "currency": "INR"
  }'

# Response:
{
  "success": true,
  "message": "Invoice updated successfully"
}
```

### 12. Submit for Approval
```bash
curl -X POST http://localhost:5000/api/invoices/1/submit \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "invoice_number": "INV001",
    "invoice_date": "2026-01-15",
    "items": [
      {
        "name": "Product A",
        "quantity": 2,
        "unit_price": 2050,
        "line_total": 4100
      }
    ]
  }'

# Response (success):
{
  "success": true,
  "message": "Invoice submitted for approval"
}

# Response (validation error):
{
  "success": false,
  "errors": {
    "invoice_number": "Invoice number is required",
    "items[0].quantity": "Quantity must be greater than 0"
  }
}
```

### 13. Approve Invoice (Owner Only)
```bash
curl -X POST http://localhost:5000/api/invoices/1/approve \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "customer": {
      "name": "ABC Traders",
      "phone": "9876543210",
      "email": "abc@example.com",
      "gstin": "29ABCDE1234F1Z5",
      "address": "123 Main St"
    },
    "items": [
      {
        "name": "Product A",
        "description": "High quality product",
        "quantity": 2,
        "unit_price": 2050,
        "tax_percentage": 18,
        "line_total": 4100
      }
    ]
  }'

# Response:
{
  "success": true,
  "message": "Invoice approved successfully"
}
```

### 14. Reject Invoice (Owner Only)
```bash
curl -X POST http://localhost:5000/api/invoices/1/reject \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "reason": "Customer details are incorrect. Please verify and resubmit."
  }'

# Response:
{
  "success": true,
  "message": "Invoice rejected"
}
```

### 15. Generate PDF (Owner Only)
```bash
curl -X POST http://localhost:5000/api/invoices/1/generate-pdf \
  -b cookies.txt

# Response:
{
  "success": true,
  "message": "PDF generated successfully",
  "documentId": "uuid-of-pdf-document"
}
```

### 16. Download Document
```bash
curl http://localhost:5000/api/documents/uuid-here \
  -b cookies.txt \
  --output invoice.pdf

# Downloads the file
```

### Invoice Helper Endpoints (documents + OCR)

List all documents for an invoice
```bash
curl http://localhost:5000/api/invoices/1/documents \
  -b cookies.txt

# Response:
{
  "success": true,
  "documents": [
    {
      "document_id": "uuid-here",
      "file_name": "invoice1.jpg",
      "content_type": "image/jpeg",
      "position": 1
    }
  ]
}
```

Fetch OCR data for an invoice
```bash
curl http://localhost:5000/api/invoices/1/ocr \
  -b cookies.txt

# Response:
{
  "success": true,
  "ocr": {
    "raw": { ... },
    "normalized": {
      "invoice": { "invoice_number": "INV-123", "invoice_date": "2026-01-15" },
      "customer": { "name": "ABC Traders" },
      "items": []
    }
  }
}
```

Serve a single document by ID (binary response)
```bash
curl http://localhost:5000/api/documents/uuid-here \
  -b cookies.txt \
  --output invoice-file
```

## Customers

### 17. Get All Customers
```bash
curl http://localhost:5000/api/customers \
  -b cookies.txt

# Response:
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "name": "ABC Traders",
      "phone": "9876543210",
      "email": "abc@example.com",
      "gstin": "29ABCDE1234F1Z5",
      "invoice_count": "5",
      "total_spent": "25000.00"
    }
  ]
}
```

### 18. Get Customer by ID
```bash
curl http://localhost:5000/api/customers/1 \
  -b cookies.txt

# Response:
{
  "success": true,
  "customer": {
    "id": 1,
    "name": "ABC Traders",
    "phone": "9876543210",
    "email": "abc@example.com"
  },
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV001",
      "invoice_date": "2026-01-15",
      "total_amount": "5000.00",
      "status": "APPROVED"
    }
  ]
}
```

## Products

### 19. Get All Products
```bash
curl http://localhost:5000/api/products \
  -b cookies.txt

# Response:
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Product A",
      "sku": "SKU001",
      "standard_price": "2050.00",
      "times_sold": "10",
      "total_quantity": "25",
      "total_revenue": "51250.00"
    }
  ]
}
```

### 20. Get Product by ID
```bash
curl http://localhost:5000/api/products/1 \
  -b cookies.txt

# Response:
{
  "success": true,
  "product": {
    "id": 1,
    "name": "Product A",
    "sku": "SKU001",
    "hsn": "1234",
    "standard_price": "2050.00",
    "created_at": "2026-01-01T10:00:00.000Z"
  }
}
```

## Reports

### 21. Dashboard Metrics
```bash
curl "http://localhost:5000/api/reports/dashboard?startDate=2026-01-01&endDate=2026-01-31" \
  -b cookies.txt

# Response:
{
  "success": true,
  "metrics": {
    "total_revenue": "125000.00",
    "invoice_count": "25",
    "avg_value": "5000.00",
    "avg_approval_days": "2.5"
  }
}
```

### 22. Revenue Flow
```bash
curl "http://localhost:5000/api/reports/revenue-flow?days=30" \
  -b cookies.txt

# Response:
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01",
      "daily_revenue": "5000.00",
      "avg_hours_to_approve": "48.5",
      "invoice_count": "3"
    }
  ]
}
```

### 23. Top Customers
```bash
curl "http://localhost:5000/api/reports/top-customers?limit=10" \
  -b cookies.txt

# Response:
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "name": "ABC Traders",
      "phone": "9876543210",
      "total_spent": "50000.00",
      "invoice_count": "10",
      "revenue_percentage": "25.50"
    }
  ]
}
```

### 24. Product Performance
```bash
curl http://localhost:5000/api/reports/product-performance \
  -b cookies.txt

# Response:
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Product A",
      "sku": "SKU001",
      "total_quantity": "100",
      "total_revenue": "205000.00",
      "times_sold": "50",
      "avg_price": "2050.00"
    }
  ]
}
```

### 25. Weekly Pattern
```bash
curl http://localhost:5000/api/reports/weekly-pattern \
  -b cookies.txt

# Response:
{
  "success": true,
  "pattern": [
    {
      "day_name": "Monday",
      "day_number": 1,
      "invoice_count": "15",
      "avg_amount": "4500.00"
    }
  ]
}
```

### 26. Status Distribution
```bash
curl http://localhost:5000/api/reports/status-distribution \
  -b cookies.txt

# Response:
{
  "success": true,
  "distribution": [
    {
      "status": "APPROVED",
      "count": "50",
      "total_value": "250000.00"
    },
    {
      "status": "PENDING_REVIEW",
      "count": "10",
      "total_value": "50000.00"
    }
  ]
}
```

## Audit

### 27. Get Invoice Audit Trail
```bash
curl http://localhost:5000/api/audit/invoice/1 \
  -b cookies.txt

# Response:
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "action": "INVOICE_UPLOADED",
      "timestamp": "2026-01-01T10:00:00.000Z",
      "user_name": "Admin Owner",
      "user_email": "owner@invoice.com",
      "details": { "file_count": 2 }
    },
    {
      "id": 2,
      "action": "INVOICE_APPROVED",
      "timestamp": "2026-01-01T11:00:00.000Z",
      "user_name": "Admin Owner",
      "details": { "customer_id": 1 }
    }
  ]
}
```

### 28. Get All Audit Logs (Owner Only)
```bash
curl "http://localhost:5000/api/audit?action=INVOICE_APPROVED&startDate=2026-01-01" \
  -b cookies.txt

# Response:
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "invoice_id": 1,
      "action": "INVOICE_APPROVED",
      "timestamp": "2026-01-01T11:00:00.000Z",
      "user_name": "Admin Owner",
      "user_email": "owner@invoice.com",
      "details": {}
    }
  ]
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

### 400 Bad Request (Validation)
```json
{
  "success": false,
  "errors": {
    "invoice_number": "Invoice number is required",
    "items[0].quantity": "Quantity must be greater than 0"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred. Please try again."
}
```

## Testing with Postman

1. Import this collection structure
2. Set base URL as variable: `{{base_url}} = http://localhost:5000/api`
3. Use Tests tab to save cookie after login
4. All subsequent requests will use the cookie automatically

## Testing with curl

Save cookie to file after login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@invoice.com","password":"admin123"}' \
  -c cookies.txt
```

Use cookie in subsequent requests:
```bash
curl http://localhost:5000/api/invoices -b cookies.txt
```

---

**Total Endpoints: 35 documented API endpoints**

Breakdown:
- Auth: 4 (login, logout, me, verify-password)
- Users: 6 (list, create, deactivate, reactivate, role, delete)
- Invoices: 11 (upload, list, detail, update, submit, approve, reject, generate-pdf, documents, ocr, delete, match-customer)
- Documents: 1 (serve by ID)
- Customers: 2 (list, detail)
- Products: 2 (list, detail)
- Reports: 7 (analytics, dashboard, revenue-flow, top-customers, product-performance, weekly-pattern, status-distribution)
- Audit: 2 (all, invoice-specific)
