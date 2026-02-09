# Smart Invoice Digitization and Management System

Full-stack invoice management system with OCR integration, multi-stage approval workflow, comprehensive analytics, and complete audit trail.

## ✨ Features

### 🎯 Core Workflow
- **Multi-format Upload**: Support for multiple images and PDF documents per invoice
- **OCR Integration**: External OCR service with automatic data extraction and normalization
- **Review & Edit**: Rich form interface with OCR pre-fill, customer matching, and product autocomplete
- **Approval Workflow**: Two-stage process (Staff → Accountant/Owner) with rejection feedback
- **PDF Generation**: Automated invoice PDF generation with download capability
- **Document Management**: Secure MongoDB storage with streaming download

### 📊 Analytics & Insights  
- **Revenue Analytics**: Monthly trends, year-over-year comparison with momentum indicators
- **Top Performers**: Customer and product performance metrics
- **Status Distribution**: Visual invoice status breakdown with pie charts
- **Operational Metrics**: Average items per invoice, busiest days, active customers
- **Export Options**: Download analytics as CSV or PDF reports with date ranges
- **Smart Filtering**: Date range presets (7 days, 30 days, quarter, year, custom)

### 🔍 Advanced Features
- **Client-Side Filtering**: Instant search, status, date range, and creator filters (no server queries)
- **Creator Management**: Owner view with per-staff invoice filtering and counts
- **Duplicate Detection**: Smart checking for duplicate invoice numbers with override option
- **Customer Matching**: Fuzzy search with phone normalization and confidence scoring
- **Product Search**: Autocomplete with similar product detection and price range validation
- **Audit Trail**: Complete action log with user tracking, timestamps, and invoice linking
- **User Management**: Role-based access (Owner/Staff/Accountant) with password-protected actions

### 🎨 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Theme toggle with system preference detection
- **Animations**: Smooth transitions with Framer Motion
- **Real-time Updates**: Optimistic UI updates and instant feedback
- **Pagination**: Efficient data display with 3x3 grid layouts
- **Toast Notifications**: Action confirmations and error handling
- **Keyboard Shortcuts**: Quick navigation and actions

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Express.js
- **Databases**: 
  - PostgreSQL (Neon) for structured data
  - MongoDB Atlas for documents and OCR payloads
- **Authentication**: JWT with httpOnly cookies
- **File Handling**: Multer for uploads, streaming downloads
- **Validation**: Custom middleware with bcrypt password hashing
- **Logging**: Comprehensive audit service

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6 with protected routes
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **HTTP**: Axios with interceptors
- **State**: Context API for auth and theme

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon.tech recommended)
- MongoDB Atlas cluster
- Optional: External OCR service (Python-based)

## 🚀 Quick Start

### Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux/macOS:**
```bash
chmod +x start.sh && ./start.sh
```

### Manual Setup

1. **Install Dependencies**
```bash
npm install
cd client && npm install && cd ..
```

2. **Configure Environment**

Create `.env` file in root:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connections
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invoice_system?retryWrites=true&w=majority
POSTGRES_URI=postgresql://username:password@host.region.neon.tech/invoice_db?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# OCR Service (Optional)
OCR_SERVICE_URL=http://localhost:8000/api/v1/process-invoice
OCR_TIMEOUT=100000

# File Uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

3. **Seed Database**
```bash
node server/seed.js
```

Creates demo users:
- **Owner**: owner@invoice.com / admin123
- **Staff**: staff@invoice.com / staff123
- **Accountant**: accountant@invoice.com / accountant123

4. **Start Development Servers**
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📱 Application Flow

```
┌─────────────┐
│   UPLOAD    │  Multi-image/PDF upload with drag-drop
└──────┬──────┘
       │ OCR Processing (external service)
       ↓
┌─────────────┐
│   REVIEW    │  Manual verification + correction
│ (Staff/All) │  - Customer matching
└──────┬──────┘  - Product autocomplete
       │ Submit  - Duplicate detection
       ↓
┌─────────────┐
│  APPROVAL   │  Final validation
│   (Owner)   │  - Approve → Database
└──────┬──────┘  - Reject → Back to review
       │
       ↓
┌─────────────┐
│  APPROVED   │  PDF generation
│   Invoice   │  Analytics updated
└─────────────┘  Audit log created
```

## 🔑 User Roles & Permissions

| Feature | Owner | Staff | Accountant |
|---------|-------|-------|------------|
| Upload Invoices | ✅ | ✅ | ❌ |
| Review Invoices | ✅ | ✅ | ❌ |
| Submit for Approval | ✅ | ✅ | ❌ |
| Approve/Reject | ✅ | ❌ | ❌ |
| View All Invoices | ✅ (all) | ✅ (own) | ✅ (approved) |
| Delete Invoices | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Analytics & Reports | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ❌ | ❌ |
| Filter by Creator | ✅ | ❌ | ❌ |

## 🌐 API Endpoints

### Authentication (4)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-password` - Verify password for sensitive actions

### Invoices (12)
- `POST /api/invoices/upload` - Upload invoice documents
- `GET /api/invoices` - List invoices (role-based filtering)
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/submit` - Submit for approval
- `POST /api/invoices/:id/approve` - Approve invoice
- `POST /api/invoices/:id/reject` - Reject invoice
- `DELETE /api/invoices/:id` - Delete invoice (Owner only)
- `POST /api/invoices/:id/generate-pdf` - Generate PDF
- `GET /api/invoices/:id/documents` - List invoice documents
- `GET /api/invoices/:id/ocr` - Get OCR data
- `POST /api/invoices/match-customer` - Match customer by name/phone

### Documents (1)
- `GET /api/documents/:documentId` - Download document (streaming)

### Users (6)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `PATCH /api/users/:id/reactivate` - Reactivate user
- `PATCH /api/users/:id/role` - Change user role
- `DELETE /api/users/:id` - Delete user

### Customers (2)
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details

### Products (5)
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/search` - Search products
- `GET /api/products/:id/price-range` - Get product price range
- `POST /api/products/find-similar` - Find similar products

### Analytics (7)
- `GET /api/insights/analytics` - Comprehensive analytics with date ranges
- `GET /api/reports/dashboard` - Dashboard KPIs
- `GET /api/reports/revenue-flow` - Monthly revenue trends
- `GET /api/reports/top-customers` - Top customers by revenue
- `GET /api/reports/product-performance` - Product sales metrics
- `GET /api/reports/weekly-pattern` - Weekly sales patterns
- `GET /api/reports/status-distribution` - Invoice status breakdown

### Audit (2)
- `GET /api/audit` - List all audit logs (with filters)
- `GET /api/audit/invoice/:id` - Get invoice audit trail

## 📁 Project Structure

```
copilot/
├── server/
│   ├── config/
│   │   ├── database.js         # DB connections
│   │   └── schema.js            # PostgreSQL schema
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── invoice.controller.js
│   │   ├── user.controller.js
│   │   ├── customer.controller.js
│   │   ├── product.controller.js
│   │   ├── insights.controller.js
│   │   ├── report.controller.js
│   │   └── audit.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   └── upload.middleware.js # Multer config
│   ├── routes/                  # Express routes
│   ├── services/
│   │   ├── document.service.js  # MongoDB operations
│   │   ├── ocr.service.js       # OCR integration
│   │   └── audit.service.js     # Audit logging
│   ├── utils/
│   │   ├── phoneNormalizer.js
│   │   ├── dateNormalizer.js
│   │   ├── cacheManager.js
│   │   └── logger.js
│   ├── index.js                 # Server entry
│   └── seed.js                  # Database seeding
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── CreatorFilter.jsx
│   │   │   ├── CustomerMatchCard.jsx
│   │   │   ├── ProductAutoComplete.jsx
│   │   │   ├── DuplicateInvoiceAlert.jsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── UploadInvoice.jsx
│   │   │   ├── ReviewInvoices.jsx
│   │   │   ├── ReviewInvoiceDetail.jsx
│   │   │   ├── ApproveInvoices.jsx
│   │   │   ├── InvoiceList.jsx
│   │   │   ├── InvoiceDetail.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── AuditLog.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios instance
│   │   ├── utils/
│   │   │   ├── invoiceUtils.js  # Client-side filtering
│   │   │   ├── dateFormatter.js
│   │   │   └── toast.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── .env                         # Environment variables
├── .env.example                 # Template
├── package.json
├── start.ps1                    # Windows startup script
├── start.sh                     # Linux/macOS startup script
├── README.md
├── SETUP.md                     # Detailed setup guide
└── TROUBLESHOOTING.md           # Common issues
```

## 🧪 Testing the Application

1. **Upload Flow** (Staff/Owner)
   - Upload multiple images or PDF
   - OCR extracts data (if service available)
   - Save as draft or submit

2. **Review Flow** (Staff/Owner)
   - Open pending review invoice
   - Verify/correct OCR data
   - Match customer (fuzzy search)
   - Add products (autocomplete)
   - Submit for approval

3. **Approval Flow** (Owner)
   - Review submitted invoices
   - Approve → Invoice saved to DB
   - Reject → Back to review with reason

4. **Analytics** (All roles)
   - View dashboard metrics
   - Filter by date ranges
   - Export CSV/PDF reports

5. **Audit Trail** (Owner)
   - View all system actions
   - Filter by user, action, date, invoice
   - Track invoice lifecycle

## 📝 Known Limitations

- OCR service must be provided externally (works with manual entry if unavailable)
- File size limited to 10MB per upload
- PDF generation uses basic template (can be enhanced with custom branding)
- No real-time notifications (polling required for updates)
- Bulk operations not yet implemented

## 🔮 Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Bulk invoice operations (approve/reject multiple)
- [ ] Advanced PDF templating with custom branding
- [ ] Email notifications for approval workflow
- [ ] Mobile app (React Native)
- [ ] Integration with accounting software
- [ ] Machine learning for better OCR accuracy
- [ ] Blockchain for invoice verification

## 📚 Documentation

- **Setup Guide**: See [SETUP.md](SETUP.md) for detailed installation steps
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for efficient, auditable invoice management**
