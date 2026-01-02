# Smart Invoice Digitization and Management System

A full-stack web application that digitizes paper invoices using OCR, enforces mandatory manual review and approval, securely stores invoice documents and structured data, and provides powerful search, reporting, and audit capabilities.

## 🎯 Features

### Core Functionality
- **OCR Integration**: External Python OCR service integration with automatic data extraction
- **Multi-Image Support**: Upload multiple images for single invoice
- **Review Workflow**: Manual review and correction of OCR-extracted data
- **Approval System**: Owner-only approval with customer/product matching
- **Document Storage**: Secure MongoDB storage for original and generated PDFs
# Smart Invoice Digitization and Management System

Full-stack invoice digitization, review, approval, storage, analytics, and audit trail. Latest updates include the fully built review/approval queues, audit log viewer, and secure document serving.

## Features

- **End-to-end workflow**: Upload (multi-image/PDF) → OCR → Review → Submit → Approve/Reject → PDF stub → Reports/Audit.
- **Data + files**: PostgreSQL for structured data, MongoDB for documents and OCR payloads.
- **Role-aware UI**: Owner (admin), Staff (ops), Accountant (viewer) with route guarding and API enforcement.
- **Reporting**: Revenue flow, top customers, product performance, weekly patterns, status distribution.
- **Auditability**: Every action logged with user context; audit log viewer with filtering and pagination.
- **Polished UX**: Drag-drop uploads, animated UI (Framer Motion), responsive layouts, multi-image carousel in review detail.

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL (Neon), MongoDB Atlas, JWT + httpOnly cookies, Multer uploads, Axios for OCR.
- **Frontend**: React 18, React Router v6, Tailwind CSS, Framer Motion, Recharts, Axios.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- MongoDB Atlas cluster
- Optional external OCR service (Python) reachable via HTTP

## Setup

**Quick Start (Automated):**
- Windows: Run `./start.ps1` in PowerShell
- Linux/macOS: Run `chmod +x start.sh && ./start.sh`

**Manual Setup:**

1) Install dependencies
```bash
npm install
cd client && npm install && cd ..
```

2) Configure environment
```env
# Server
PORT=5000
NODE_ENV=development

# Databases
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invoice_system?retryWrites=true&w=majority
POSTGRES_URI=postgresql://username:password@host.region.neon.tech/invoice_db?sslmode=require

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OCR (optional - system works without it)
OCR_SERVICE_URL=http://localhost:8000/api/v1/process-invoice
OCR_TIMEOUT=100000

# Uploads
MAX_FILE_SIZE=10485760
```

3) Seed databases
```bash
node server/seed.js
```
Creates tables and demo users:
- Owner: owner@invoice.com / admin123
- Staff: staff@invoice.com / staff123
- Accountant: accountant@invoice.com / accountant123

4) Run
- Both servers: `npm run dev`
- Backend only: `npm run server`
- Frontend only: `npm run client`

Frontend: http://localhost:5173 • API: http://localhost:5000

## Invoice Lifecycle

```
Upload → PENDING_REVIEW
  • Multi-image upload stored in MongoDB
  • OCR kicks in (if configured)

Review → PENDING_REVIEW
  • Rich review form with OCR prefill, multi-image carousel
  • Save draft or submit

Submit → PENDING_APPROVAL
  • Validation and audit logging

Approve/Reject → APPROVED or back to PENDING_REVIEW
  • Customer/Product matching and SQL writes
  • Rejection requires reason

Generate PDF (stub)
  • Placeholder PDF stored in MongoDB
```

## API Surface (35 endpoints)

- **Auth (4)**: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/verify-password
- **Invoices (11)**: POST /api/invoices/upload, GET /api/invoices, GET /api/invoices/:id, PUT /api/invoices/:id, POST /api/invoices/:id/submit, POST /api/invoices/:id/approve, POST /api/invoices/:id/reject, POST /api/invoices/:id/generate-pdf, GET /api/invoices/:id/documents, GET /api/invoices/:id/ocr, DELETE /api/invoices/:id, POST /api/invoices/match-customer
- **Documents (1)**: GET /api/documents/:documentId
- **Users (6)**: GET /api/users, POST /api/users, PATCH /api/users/:id/deactivate, PATCH /api/users/:id/reactivate, PATCH /api/users/:id/role, DELETE /api/users/:id
- **Customers (2)**: GET /api/customers, GET /api/customers/:id
- **Products (2)**: GET /api/products, GET /api/products/:id
- **Reports (7)**: GET /api/reports/analytics, GET /api/reports/dashboard, GET /api/reports/revenue-flow, GET /api/reports/top-customers, GET /api/reports/product-performance, GET /api/reports/weekly-pattern, GET /api/reports/status-distribution
- **Audit (2)**: GET /api/audit, GET /api/audit/invoice/:id

## Testing the App

- **Owner**: Upload → Review → Submit → Approve/Reject; generate PDF stub; verify audit log entries and reports update.
- **Staff**: Upload → Review → Submit; ensure no approval buttons.
- **Accountant**: Confirm view-only access to approved invoices and all reports.
- **Documents**: Download via GET /api/documents/:documentId from an invoice.

## Known Limitations

- PDF generation uses a placeholder; integrate a renderer (e.g., pdfkit) for production PDFs.
- OCR service must be provided externally; system works with manual entry when unavailable.
- No real-time notifications or CSV/Excel export yet.

## Next Improvements

- Wire real PDF rendering
- Add exports and bulk ops
- Add notifications/webhooks and optional real-time updates
- Harden production deployment (rate limits, logging, backups)

## Project Structure

```
copilot/
├── server/
│   ├── config/          # Database connections and schema
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, upload, etc.
│   ├── routes/          # API routes (incl. documents)
│   ├── services/        # Business logic
│   ├── index.js         # Server entry
│   └── seed.js          # Database seeding
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/       # Includes review detail, approval queue, audit log
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── package.json
└── .env.example
```

## Troubleshooting & Docs

- Quick start card: QUICKSTART.txt
- Step-by-step setup: SETUP.md
- Common issues: TROUBLESHOOTING.md
- API examples: API_TESTING.md

## License

MIT License

---

Built for efficient, auditable invoice management.
   - PDF stored in MongoDB
