# Smart Invoice System - Setup Guide

## Quick Start Guide (Windows)

### Step 1: Verify Prerequisites
```powershell
# Check Node.js version (should be 18+)
node --version

# Check npm
npm --version
```

### Step 2: Install Dependencies
```powershell
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

2. Edit `.env` and update these values:

**MongoDB Atlas Setup:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

**NeonDB (PostgreSQL) Setup:**
1. Go to https://neon.tech
2. Create free project
3. Get connection string
4. Update `POSTGRES_URI` in `.env`

**Required .env values:**
```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/invoice_system
POSTGRES_URI=postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST.neon.tech/invoice_db?sslmode=require
JWT_SECRET=change-this-to-a-random-secret-key
OCR_SERVICE_URL=http://localhost:8000/ocr/process
```

### Step 4: Seed Database
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

**Option 1: Both servers together**
```powershell
npm run dev
```

**Option 2: Separate terminals**

Terminal 1:
```powershell
npm run server
```

Terminal 2:
```powershell
npm run client
```

### Step 6: Access Application

Open browser to: **http://localhost:5173**

Login with:
- Owner: `owner@invoice.com` / `admin123`
- Staff: `staff@invoice.com` / `staff123`
- Accountant: `accountant@invoice.com` / `accountant123`

## 🔧 Troubleshooting

### "Cannot find module" errors
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules
npm install
cd client
npm install
cd ..
```

### Database connection errors
- Verify your MongoDB URI is correct
- Check PostgreSQL connection string
- Ensure your IP is whitelisted in MongoDB Atlas
- For NeonDB, ensure SSL mode is set

### Port already in use
```powershell
# Find and kill process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Or change port in .env
PORT=5001
```

### OCR service not available
The OCR service is external. For development:
1. The system will work without it (returns empty OCR data)
2. You can manually enter all invoice data
3. To add real OCR, deploy a Python OCR service separately

## 📝 Development Workflow

### Testing the Full Flow

1. **As Owner** (owner@invoice.com):
   - Upload an invoice (use any image/PDF)
   - Review the OCR data (will be empty without OCR service)
   - Manually enter invoice data
   - Submit for approval
   - Go to "Approve Queue"
   - Approve the invoice
   - View in "All Invoices"
   - Check Reports dashboard

2. **As Staff** (staff@invoice.com):
   - Upload an invoice
   - Review and submit
   - Verify you cannot see "Approve Queue"
   - View only your own pending invoices

3. **As Accountant** (accountant@invoice.com):
   - View only approved invoices
   - Access reports
   - Verify no upload/review access

## 🗃️ Database Management

### Reset Database
```powershell
# Re-run seed script (will skip if owner exists)
node server/seed.js
```

### Access PostgreSQL
If using NeonDB, use their web SQL editor or:
```powershell
# Install PostgreSQL client
# Then connect:
psql "postgresql://user:pass@host.neon.tech/invoice_db?sslmode=require"
```

### Access MongoDB
Use MongoDB Compass:
1. Download from: https://www.mongodb.com/products/compass
2. Connect using your MONGODB_URI
3. Browse `invoice_system` database

## 🎨 Customization

### Change Theme Colors
Edit `client/tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'pending-review': '#YOUR_COLOR',
      'pending-approval': '#YOUR_COLOR',
      'approved': '#YOUR_COLOR',
      'rejected': '#YOUR_COLOR',
    }
  }
}
```

### Add New User Role
1. Update database schema in `server/config/schema.js`
2. Add role to JWT middleware
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
