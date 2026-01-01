# Smart Invoice Digitization and Management System

A full-stack web application that digitizes paper invoices using OCR, enforces mandatory manual review and approval, securely stores invoice documents and structured data, and provides powerful search, reporting, and audit capabilities.

## 🎯 Features

### Core Functionality
- **OCR Integration**: External Python OCR service integration with automatic data extraction
- **Multi-Image Support**: Upload multiple images for single invoice
- **Review Workflow**: Manual review and correction of OCR-extracted data
- **Approval System**: Owner-only approval with customer/product matching
- **Document Storage**: Secure MongoDB storage for original and generated PDFs
- **Structured Data**: PostgreSQL for validated business data
- **Audit Trail**: Complete logging of all actions and state changes

### User Roles
- **Owner (Admin)**: Full system access including approval and user management
- **Staff**: Upload, review, and submit invoices for approval
- **Accountant**: View-only access to approved invoices and reports

### Analytics & Reporting
- Business pulse dashboard with key metrics
- Revenue flow visualization
- Top customers leaderboard
- Product performance analytics
- Weekly pattern analysis

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (NeonDB) - Structured data
- MongoDB Atlas - Document storage
- JWT Authentication with httpOnly cookies
- Multer for file uploads
- Axios for OCR service integration

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Framer Motion (animations)
- Recharts (data visualization)
- Axios (API calls)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (NeonDB recommended)
- MongoDB Atlas account
- External OCR service (Python) running separately

## 🚀 Installation

### 1. Clone the repository
```bash
cd copilot
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

### 4. Configure environment variables

Create `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invoice_system?retryWrites=true&w=majority
POSTGRES_URI=postgresql://username:password@host.region.neon.tech/invoice_db?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OCR Service Configuration
OCR_SERVICE_URL=http://localhost:8000/ocr/process
OCR_TIMEOUT=30000

# File Upload Configuration
MAX_FILE_SIZE=10485760
```

### 5. Seed the database

```bash
node server/seed.js
```

This creates:
- Database tables (PostgreSQL)
- Initial users:
  - **Owner**: owner@invoice.com / admin123
  - **Staff**: staff@invoice.com / staff123
  - **Accountant**: accountant@invoice.com / accountant123

### 6. Start the development servers

**Option 1: Run both servers together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

### 7. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📊 Database Schema

### PostgreSQL Tables
- `users` - User accounts and roles
- `customers` - Customer information
- `products` - Product catalog
- `invoices` - Invoice header data
- `invoice_items` - Invoice line items
- `audit_log` - System audit trail

### MongoDB Collections
- `documents` - Binary file storage (images, PDFs)
- `ocr_data` - Raw and normalized OCR responses

## 🔄 Invoice Lifecycle

```
1. UPLOAD → PENDING_REVIEW
   - Staff/Owner uploads invoice images
   - Files stored in MongoDB
   - OCR processing initiated

2. REVIEW → PENDING_REVIEW
   - User reviews and corrects OCR data
   - Edit any fields as needed

3. SUBMIT → PENDING_APPROVAL
   - Validation checks performed
   - Status changes to PENDING_APPROVAL

4. APPROVE → APPROVED
   - Owner reviews and approves
   - Customer/Product matching
   - Data saved to PostgreSQL
   
   OR
   
   REJECT → PENDING_REVIEW
   - Owner rejects with reason
   - Returns to review stage

5. GENERATE PDF (Optional)
   - Owner generates formatted PDF
   - PDF stored in MongoDB
```

## 🎨 UI Design Philosophy

The system emphasizes **transformation from analog to digital**:

- Progressive color system (amber → indigo → green)
- Tactile upload experience with drag-and-drop
- Smooth animations with Framer Motion
- Accessible design (WCAG compliant)
- Responsive layouts for all screen sizes

## 🔐 Security Features

- JWT tokens in httpOnly cookies (XSS protection)
- Role-based access control
- Password hashing with bcrypt
- SQL injection prevention (parameterized queries)
- File type and size validation
- Environment-based configuration

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Invoices
- `POST /api/invoices/upload` - Upload invoice
- `GET /api/invoices` - List invoices (with filters)
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/submit` - Submit for approval
- `POST /api/invoices/:id/approve` - Approve invoice (Owner)
- `POST /api/invoices/:id/reject` - Reject invoice (Owner)
- `POST /api/invoices/:id/generate-pdf` - Generate PDF (Owner)

### Users (Owner only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `PATCH /api/users/:id/role` - Change user role

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/revenue-flow` - Revenue timeline
- `GET /api/reports/top-customers` - Top customers
- `GET /api/reports/product-performance` - Product analytics

### Audit
- `GET /api/audit/invoice/:id` - Invoice audit trail
- `GET /api/audit` - Global audit log (Owner)

## 🧪 Testing

### Manual Testing Flow

1. **Login as Owner**
   - Upload invoice with multiple images
   - Review OCR-extracted data
   - Submit for approval
   - Approve the invoice
   - Generate PDF

2. **Login as Staff**
   - Upload invoice
   - Review and submit
   - Verify cannot approve

3. **Login as Accountant**
   - View approved invoices only
   - Access reports
   - Verify cannot upload/review

## 🚧 Known Limitations

- PDF generation is stubbed (placeholder implementation)
- OCR service must be running separately
- No real-time notifications
- No bulk operations
- No Excel/CSV export

## 📝 Future Enhancements

- Actual PDF generation with pdfkit
- Email notifications
- Bulk upload
- Advanced search with Elasticsearch
- Mobile app
- Multi-tenancy support

## 🤝 Contributing

This is a lab project. Feel free to fork and extend for your needs.

## 📄 License

MIT License

## 👨‍💻 Development Notes

### Project Structure
```
copilot/
├── server/
│   ├── config/          # Database connections
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, upload, etc.
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── index.js         # Server entry
│   └── seed.js          # Database seeding
├── client/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API client
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # React entry
│   ├── index.html
│   └── vite.config.js
├── package.json
└── .env.example
```

### Adding New Features

1. Backend: Create controller → service → route
2. Frontend: Create page component → add route in App.jsx
3. Update API client in `client/src/services/api.js`
4. Follow existing patterns for consistency

### Code Style

- Use ES6+ features
- Async/await for promises
- Functional components with hooks
- Tailwind utility classes
- Semantic HTML

## 🐛 Troubleshooting

**Database connection errors:**
- Verify .env credentials
- Check firewall/network access
- Ensure databases exist

**OCR not working:**
- Verify OCR service is running
- Check OCR_SERVICE_URL in .env
- Test endpoint manually with curl

**File upload fails:**
- Check MAX_FILE_SIZE setting
- Verify file types are allowed
- Check disk space

**Frontend can't reach backend:**
- Verify proxy config in vite.config.js
- Check backend is running on port 5000
- Clear browser cache

## 📞 Support

For issues or questions, check the code comments or raise an issue in the repository.

---

**Built with ❤️ for efficient invoice management**
