# Invoice Digitization System

A complete end-to-end solution for digitizing, reviewing, approving, and managing paper invoices. This system combines intelligent OCR processing with a robust web-based workflow management application.

## 📋 Overview

This project consists of two integrated services that work together to automate and streamline invoice management:

1. **OCR Service** - OCR-based invoice data extraction with AI enhancement
2. **Web Application** - Full-stack invoice management system with review workflows

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Invoice Upload                          │
│            (PDF/Images via Web Interface)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              OCR Service (FastAPI + OCR Engine)             │
│  • PDF splitting & image processing                         │
│  • OCR-based data extraction & merging                      │
│  • Structured JSON output                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            Web App (Node.js + React + PostgreSQL)           │
│  • Review Queue - Manual verification & correction          │
│  • Approval Queue - Customer/product matching               │
│  • Document Storage - MongoDB for files                     │
│  • Reporting & Analytics - Business insights                │
│  • Audit Trail - Complete activity logging                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### OCR Service
- **Multi-format Support**: Process PDFs (single/multi-page) and images
- **Batch Processing**: Handle multiple images for a single invoice
- **OCR-Based Extraction**: Accurate text and data extraction from invoices
- **Smart Merging**: Intelligently combines data from multiple pages/images
- **Structured Output**: Clean JSON with line items and totals

### Web Application
- **Role-Based Access**: Owner, Staff, and Accountant roles with appropriate permissions
- **Review Workflow**: Manual review queue with OCR pre-filled data and multi-image carousel
- **Approval System**: Owner-exclusive approval with customer/product matching
- **Document Management**: Secure storage with MongoDB and generated PDF stubs
- **Comprehensive Reporting**: Revenue analysis, top customers, product performance
- **Complete Audit Trail**: Track all actions with user context and filtering
- **Modern UI**: Drag-drop uploads, animations, responsive design

## 📁 Project Structure

```
invoice-digitisation/
├── ocr-fastapi/              # OCR Service (Python/FastAPI)
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── README.md            # OCR service documentation
│
└── web-app/                  # Web Application (Node.js/React)
    ├── client/              # React frontend
    │   └── src/
    │       ├── pages/       # Review, Approval, Reports, etc.
    │       ├── components/  # Reusable UI components
    │       └── services/    # API integration
    │
    ├── server/              # Express backend
    │   ├── controllers/     # Business logic
    │   ├── routes/          # API endpoints
    │   ├── services/        # OCR integration, audit, documents
    │   └── middleware/      # Auth, uploads
    │
    └── README.md           # Web app documentation
```

## 🛠️ Tech Stack

### OCR Service
- **Framework**: FastAPI (Python)
- **OCR Engine**: Advanced OCR with AI enhancement (Google Gemini)
- **PDF Processing**: pdf2image, poppler-utils
- **Image Processing**: PIL/Pillow
- **Async Processing**: Python asyncio

### Web Application

**Backend:**
- Node.js & Express
- PostgreSQL (Neon) - Structured data
- MongoDB Atlas - Documents & files
- JWT Authentication (httpOnly cookies)
- Multer - File uploads

**Frontend:**
- React 18 & React Router v6
- Tailwind CSS - Styling
- Framer Motion - Animations
- Recharts - Data visualization
- Axios - HTTP client

## 📦 Prerequisites

### For OCR Service
- Python 3.8+
- Poppler (for PDF processing)
- OCR API key (Google Gemini for AI-enhanced extraction)

### For Web Application
- Node.js 18+
- PostgreSQL database (Neon recommended)
- MongoDB Atlas cluster

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd invoice-digitisation
```

### 2. Set Up OCR Service

```bash
cd ocr-fastapi

# Install system dependencies (Ubuntu/Debian)
sudo apt-get install poppler-utils

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the service
python main.py
```

OCR service will be available at: `http://localhost:8000`

For detailed setup instructions, see [ocr-fastapi/README.md](ocr-fastapi/README.md)

### 3. Set Up Web Application

```bash
cd ../web-app

# Quick automated setup (Windows)
./start.ps1

# OR Quick automated setup (Linux/macOS)
chmod +x start.sh && ./start.sh
```

The automated scripts will:
- Install all dependencies
- Help configure environment variables
- Run database migrations and seeding
- Start both frontend and backend servers

Web app will be available at: `http://localhost:5173`

For detailed setup and manual installation, see [web-app/README.md](web-app/README.md)

## 👥 Default User Accounts

After running the seed script, these accounts are available:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Owner | owner@invoice.com | admin123 | Full access, approval rights |
| Staff | staff@invoice.com | staff123 | Upload, review, submit |
| Accountant | accountant@invoice.com | accountant123 | View-only access |

## 📊 Complete Workflow

### 1. Upload Phase
- User uploads invoice (PDF or multiple images)
- Files stored in MongoDB
- Status: **PENDING_REVIEW**

### 2. OCR Processing (Automatic)
- System calls OCR service
- Data extracted and pre-filled
- Original images/PDF preserved

### 3. Review Phase (Staff)
- Review queue shows pending invoices
- View multi-image carousel
- Verify/correct OCR data
- Save draft or submit
- Status: **SUBMITTED**

### 4. Approval Phase (Owner)
- Approval queue shows submitted invoices
- Match customer and products from database
- Approve or reject with notes
- Generate PDF stub document
- Status: **APPROVED** or **REJECTED**

### 5. Reporting & Audit
- View revenue analytics
- Track top customers and products
- Filter and search audit logs
- Export data for analysis

## 🔧 Configuration

### OCR Service

Create `.env` in `ocr-fastapi/`:
```env
# OCR API Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### Web Application

Create `.env` in `web-app/`:
```env
# Server
PORT=5000
NODE_ENV=development

# Databases
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/invoice_system
POSTGRES_URI=postgresql://user:pass@host.region.neon.tech/invoice_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OCR Service
OCR_SERVICE_URL=http://localhost:8000/api/v1/process-invoice
OCR_TIMEOUT=100000

# File Upload
MAX_FILE_SIZE=10485760
```

## 📖 Documentation

Detailed documentation for each component:

- **[OCR Service Documentation](ocr-fastapi/README.md)** - API endpoints, installation, usage examples
- **[Web App Documentation](web-app/README.md)** - Setup, features, API reference, troubleshooting

Additional web app docs:
- [SETUP.md](web-app/SETUP.md) - Detailed setup instructions
- [API_TESTING.md](web-app/API_TESTING.md) - API endpoint testing guide
- [TROUBLESHOOTING.md](web-app/TROUBLESHOOTING.md) - Common issues and solutions
- [QUICKSTART.txt](web-app/QUICKSTART.txt) - Fast track setup

## 🔒 Security Features

- JWT-based authentication with httpOnly cookies
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- File upload validation and size limits
- Secure document serving with authentication

## 🧪 Testing

### Test OCR Service
```bash
cd ocr-fastapi
python test_client.py
```

### Test Web App APIs
```bash
cd web-app
# See API_TESTING.md for detailed endpoint testing
node test-data.js
```

## 📈 Performance Features

- **Concurrent Processing**: Async operations in OCR service
- **Connection Pooling**: Database connection optimization
- **Indexed Queries**: Optimized database performance
- **Chunked Uploads**: Efficient file handling
- **Pagination**: Large dataset management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the [Troubleshooting Guide](web-app/TROUBLESHOOTING.md)
- Review individual component READMEs
- Open an issue on GitHub

## 🙏 Acknowledgments

- Google Gemini for AI-enhanced OCR capabilities
- FastAPI framework
- React and Node.js communities
- All open-source contributors

---

**Project Status**: Production Ready ✅

Built with ❤️ for efficient invoice management
