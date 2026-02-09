# Smart Invoice System - Complete Setup Guide

This guide provides detailed, step-by-step instructions for setting up the Smart Invoice Management System on Windows, Linux, and macOS.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Automated Setup](#automated-setup-recommended)
- [Manual Setup](#manual-setup)
- [Database Configuration](#database-configuration)
- [Starting the Application](#starting-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

### Required
- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB Atlas account** - [Sign up at mongodb.com](https://www.mongodb.com/cloud/atlas)
- **PostgreSQL database** - [Neon.tech](https://neon.tech) recommended (free tier available)

### Optional
- **External OCR Service** - Python-based service for automatic invoice data extraction
- **Git** - For version control

### Check Prerequisites
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm
npm --version
```

---

## Automated Setup (Recommended)

The easiest way to get started is using our automated setup scripts.

### Windows (PowerShell)
```powershell
# Run the setup script
.\start.ps1
```

### Linux/macOS (Bash)
```bash
# Make script executable
chmod +x start.sh

# Run the setup script
./start.sh
```

The automated script will:
1. ✅ Check for Node.js and npm
2. ✅ Create `.env` file from template
3. ✅ Install all dependencies (backend & frontend)
4. ✅ Optionally seed the database with demo users
5. ✅ Start both development servers

**Follow the prompts** to configure your database connections.

---

## Manual Setup

If you prefer manual setup or need more control:

### Step 1: Clone or Download

```bash
# If using Git
git clone <repository-url>
cd copilot

# Or download zip and extract
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

This will install:
- **Backend**: Express, PostgreSQL client, MongoDB driver, JWT, Multer, etc.
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Recharts, etc.

### Step 3: Environment Configuration

1. **Copy the template**:
```bash
cp .env.example .env
```

2. **Edit `.env` file** with your configuration:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5000
NODE_ENV=development

# ===========================================
# DATABASE CONNECTIONS
# ===========================================

# MongoDB Atlas (for documents and OCR data)
# Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/invoice_system?retryWrites=true&w=majority

# PostgreSQL / Neon (for structured data)
# Format: postgresql://<username>:<password>@<host>/<database>?sslmode=require
POSTGRES_URI=postgresql://your_username:your_password@ep-cool-name-xxxxx.region.neon.tech/invoice_db?sslmode=require

# ===========================================
# AUTHENTICATION
# ===========================================
```powershell
node server/seed.js
```

You should see:
```
✓ Connected to MongoDB
✓ Connected to PostgreSQL
✓ Database tables created successfully
✓ Created owner user: owner@invoice.com / admin123
✓ Created staff user: staff@invoice.com / staff123
✓ Created accountant user: accountant@invoice.com / accountant123
✅ Database seeding completed successfully!
```

### Step 5: Start Development Servers

# Generate a random secret (recommended)
# Linux/macOS: openssl rand -base64 32
# Windows: [System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
JWT_SECRET=your-super-secret-jwt-key-please-change-this-in-production
JWT_EXPIRES_IN=7d

# ===========================================
# OCR SERVICE (Optional)
# ===========================================
# External Python OCR service URL
# System works without OCR - you can manually enter data
OCR_SERVICE_URL=http://localhost:8000/api/v1/process-invoice
OCR_TIMEOUT=100000

# ===========================================
# FILE UPLOADS
# ===========================================
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

---

## Database Configuration

### MongoDB Atlas Setup

1. **Create Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to you
   - Name your cluster
3. **Create Database User**:
   - Database Access → Add New Database User
   - Choose password authentication
   - Save username and password
4. **Whitelist IP**:
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your user password
   - Add database name: `/invoice_system`

**Example**:
```
mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/invoice_system?retryWrites=true&w=majority
```

### PostgreSQL / Neon Setup

1. **Create Account**: Go to [neon.tech](https://neon.tech)
2. **Create Project**:
   - Click "Create Project"
   - Name: "Invoice System"
   - Region: Choose closest
3. **Get Connection String**:
   - Dashboard → Connection Details
   - Copy "Connection string"
   - Make sure it includes `?sslmode=require`

**Example**:
```
postgresql://myuser:mypass123@ep-cool-name-12345.us-east-2.aws.neon.tech/invoice_db?sslmode=require
```

---

## Starting the Application

### Step 4: Seed Database

Initialize database with schema and demo users:

```bash
node server/seed.js
```

**Expected Output**:
```
✓ Connected to MongoDB
✓ Connected to PostgreSQL
✓ Database tables created successfully
✓ Created owner user: owner@invoice.com / admin123
✓ Created staff user: staff@invoice.com / staff123
✓ Created accountant user: accountant@invoice.com / accountant123
✅ Database seeding completed successfully!
```

### Step 5: Start Development Servers

**Option 1: Both servers together** (Recommended)
```bash
npm run dev
```

**Option 2: Separate terminals**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

**Servers will start on**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Verification

### Step 6: Test the Application

1. **Open Browser**: Navigate to `http://localhost:5173`

2. **Login with Demo Users**:
   - **Owner**: `owner@invoice.com` / `admin123`
   - **Staff**: `staff@invoice.com` / `staff123`
   - **Accountant**: `accountant@invoice.com` / `accountant123`

3. **Test Basic Flow**:
   - Upload an invoice (any image/PDF)
   - Review and enter data manually
   - Submit for approval
   - Approve as owner
   - View in reports

---

## Troubleshooting

### "Cannot find module" errors

```bash
# Delete node_modules and reinstall (Windows)
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules
npm install
cd client && npm install && cd ..

# Linux/macOS
rm -rf node_modules client/node_modules
npm install
cd client && npm install && cd ..
```

### Database Connection Errors

**MongoDB**:
- Verify connection string format
- Ensure password doesn't contain special characters (use URI encoding if needed)
- Check Network Access whitelist in MongoDB Atlas
- Test connection: `node -e "require('mongodb').MongoClient.connect('YOUR_URI', (err) => console.log(err || 'Connected'))"`

**PostgreSQL**:
- Verify connection string includes `?sslmode=require`
- Check credentials are correct
- Ensure database name exists
- Test connection: `node -e "require('pg').Pool({connectionString: 'YOUR_URI'}).query('SELECT 1', (err) => console.log(err || 'Connected'))"`

### Port Already in Use

**Windows**:
```powershell
# Find process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Or change port in .env
# PORT=5001
```

**Linux/macOS**:
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
# PORT=5001
```

### OCR Service Not Available

The OCR service is optional. Without it:
- ✅ System works normally
- ✅ Upload and review work fine
- ✅ You manually enter all invoice data
- ❌ No automatic data extraction

**To add OCR later**:
1. Deploy Python OCR service separately
2. Update `OCR_SERVICE_URL` in `.env`
3. Restart server

### Frontend Build Errors

```bash
# Clear Vite cache
cd client
rm -rf node_modules/.vite
npm run dev
```

### CORS Errors

If frontend can't reach backend:
1. Check both servers are running
2. Verify frontend is on port 5173
3. Verify backend is on port 5000
4. Check browser console for specific error

---

## Development Tips

### Database Management

**Reset Database**:
```bash
# Re-run seed (creates tables and users if missing)
node server/seed.js
```

**Access PostgreSQL** (using Neon web console):
- Login to neon.tech → Select project → SQL Editor

**Access MongoDB** (using Compass):
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your `MONGODB_URI`
3. Browse collections in `invoice_system` database

### Hot Reload

Both servers support hot reload:
- **Backend**: Changes auto-restart (via nodemon)
- **Frontend**: Changes auto-refresh (via Vite HMR)

### API Testing

Use tools like:
- **Postman**: Import endpoints from README
- **Thunder Client**: VS Code extension
- **curl**: Command line testing

Example:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@invoice.com","password":"admin123"}'

# Get invoices (include cookie from login)
curl http://localhost:5000/api/invoices \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

---

## Next Steps

1. ✅ **Explore Features**: Try all user roles and features
2. ✅ **Customize**: Update branding, colors, and theme
3. ✅ **Add Data**: Upload real invoices and products
4. ✅ **Deploy**: Consider production deployment (see TROUBLESHOOTING.md)
5. ✅ **Integrate**: Connect external OCR service for automation

---

## Additional Resources

- **Main Documentation**: [README.md](README.md)
- **Common Issues**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **MongoDB Docs**: [docs.mongodb.com](https://docs.mongodb.com)
- **PostgreSQL Docs**: [postgresql.org/docs](https://www.postgresql.org/docs)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)

---

**Need help?** Check TROUBLESHOOTING.md or review server logs in terminal where you ran `npm run server`.
3. Update UI role checks in `App.jsx`
4. Add navigation links in `DashboardLayout.jsx`

## 📦 Deployment

### Backend (Node.js)
- Deploy to: Render, Railway, Fly.io, Heroku
- Set environment variables in platform
- Use production database URLs

### Frontend (React)
- Build: `cd client && npm run build`
- Deploy `client/dist` folder to: Vercel, Netlify, Cloudflare Pages
- Update API base URL if backend is on different domain

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb
POSTGRES_URI=your_production_postgres
JWT_SECRET=long_random_production_secret
OCR_SERVICE_URL=your_production_ocr_url
```

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to random value
- [ ] Use strong database passwords
- [ ] Enable SSL for databases in production
- [ ] Set NODE_ENV=production
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set up database backups

## 📚 Additional Resources

- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- NeonDB: https://neon.tech/docs
- React Router: https://reactrouter.com/
- Tailwind CSS: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion/

## 🆘 Getting Help

1. Check the main README.md
2. Review code comments
3. Check browser console for errors
4. Check server terminal for backend errors
5. Verify environment variables are set

---

**Happy Coding! 🚀**
