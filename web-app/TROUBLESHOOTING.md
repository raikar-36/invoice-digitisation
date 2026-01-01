# Troubleshooting Guide

Common issues and solutions for the Smart Invoice System.

## Installation Issues

### ❌ "Cannot find module 'express'"
**Problem**: Dependencies not installed

**Solution**:
```powershell
# Delete and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# For frontend
cd client
Remove-Item -Recurse -Force node_modules  
Remove-Item package-lock.json
npm install
cd ..
```

### ❌ "npm ERR! ERESOLVE unable to resolve dependency tree"
**Problem**: Dependency conflicts

**Solution**:
```powershell
npm install --legacy-peer-deps
cd client
npm install --legacy-peer-deps
cd ..
```

## Database Issues

### ❌ "MongoServerError: bad auth"
**Problem**: Invalid MongoDB credentials

**Solution**:
1. Verify MongoDB Atlas credentials
2. Check database user has correct permissions
3. Ensure IP whitelist includes your IP (0.0.0.0/0 for testing)
4. Update `MONGODB_URI` in .env with correct format:
```
mongodb+srv://username:password@cluster.mongodb.net/invoice_system?retryWrites=true&w=majority
```

### ❌ "error: password authentication failed for user"
**Problem**: Invalid PostgreSQL credentials

**Solution**:
1. Verify NeonDB credentials
2. Check connection string format:
```
postgresql://username:password@hostname.region.neon.tech/dbname?sslmode=require
```
3. Ensure SSL mode is enabled
4. Test connection with psql client

### ❌ "relation 'users' does not exist"
**Problem**: Database tables not created

**Solution**:
```powershell
node server/seed.js
```

This will:
- Create all tables
- Add initial users
- Set up database schema

### ❌ "duplicate key value violates unique constraint"
**Problem**: Trying to create duplicate data

**Solution**:
- For users: Use different email
- For customers: Use different phone number
- For products: Use different product name

## Server Issues

### ❌ "Error: listen EADDRINUSE: address already in use :::5000"
**Problem**: Port 5000 already in use

**Solution 1 - Kill existing process**:
```powershell
# Find process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Kill it
Stop-Process -Id <PID>
```

**Solution 2 - Use different port**:
Edit `.env`:
```env
PORT=5001
```

### ❌ "Cannot GET /"
**Problem**: Accessing backend URL directly

**Solution**:
Backend is API only. Access frontend at http://localhost:5173

### ❌ "JWT_SECRET is not defined"
**Problem**: Environment variable not loaded

**Solution**:
1. Ensure `.env` file exists in root directory
2. Check `.env` has `JWT_SECRET=your-secret-key`
3. Restart server after editing `.env`

## Frontend Issues

### ❌ "Failed to fetch" or "Network Error"
**Problem**: Backend not running or wrong URL

**Solution**:
1. Verify backend is running on port 5000:
```powershell
curl http://localhost:5000/health
```

2. Check Vite proxy config in `client/vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

### ❌ "Cannot read properties of undefined (reading 'user')"
**Problem**: AuthContext not initialized

**Solution**:
Ensure App.jsx wraps everything in AuthProvider:
```jsx
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>
```

### ❌ Tailwind styles not working
**Problem**: Tailwind not configured properly

**Solution**:
1. Check `tailwind.config.js` content paths:
```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

2. Ensure `index.css` has Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. Restart dev server

### ❌ "Module not found: Can't resolve 'framer-motion'"
**Problem**: Frontend dependencies not installed

**Solution**:
```powershell
cd client
npm install
cd ..
```

## Authentication Issues

### ❌ "Invalid credentials" (correct password)
**Problem**: User not seeded or wrong email

**Solution**:
1. Run seed script:
```powershell
node server/seed.js
```

2. Use correct demo credentials:
- owner@invoice.com / admin123
- staff@invoice.com / staff123
- accountant@invoice.com / accountant123

### ❌ "Authentication required" after login
**Problem**: Cookie not being set

**Solution**:
1. Check browser allows cookies
2. Verify `withCredentials: true` in api.js:
```javascript
const api = axios.create({
  withCredentials: true
});
```

3. Check CORS config in server:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### ❌ Session expires immediately
**Problem**: JWT secret mismatch or short expiry

**Solution**:
Check `.env`:
```env
JWT_SECRET=consistent-secret-key-here
JWT_EXPIRES_IN=7d
```

## File Upload Issues

### ❌ "Total file size exceeds 10MB limit"
**Problem**: Files too large

**Solution**:
1. Compress images before upload
2. Or increase limit in `.env`:
```env
MAX_FILE_SIZE=20971520  # 20MB
```

### ❌ "Only JPEG, PNG, and PDF files are supported"
**Problem**: Invalid file type

**Solution**:
Convert files to JPEG, PNG, or PDF before uploading

### ❌ "Request Entity Too Large"
**Problem**: Express body size limit

**Solution**:
Add to `server/index.js`:
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

## OCR Issues

### ❌ "OCR service unavailable"
**Problem**: External OCR service not running

**Solution**:
This is expected if you don't have OCR service. System will:
- Return empty OCR data
- Allow manual entry of all fields
- Still process invoice normally

To add OCR:
1. Deploy Python OCR service separately
2. Update `OCR_SERVICE_URL` in `.env`
3. Ensure service accepts multipart/form-data POST requests

### ❌ OCR data is empty
**Problem**: OCR service returned no data

**Solution**:
1. Check OCR service logs
2. Verify image quality
3. Manually enter invoice data in review form

## Permission/Role Issues

### ❌ "Insufficient permissions"
**Problem**: User role doesn't have access

**Solution**:
Check role requirements:
- **Owner**: All access
- **Staff**: Upload, review, submit (no approval)
- **Accountant**: View approved only

To change role:
1. Login as owner
2. Go to User Management
3. Change user role

### ❌ Can't see certain pages
**Problem**: Role-based routing

**Solution**:
This is intentional:
- Staff can't see "Approve Queue"
- Accountant can't see "Upload" or "Review"
- Only owner sees "User Management"

## Performance Issues

### ❌ Slow invoice loading
**Problem**: Large files or many invoices

**Solution**:
1. Add pagination to invoice list
2. Compress images before upload
3. Add database indexes:
```sql
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
```

### ❌ Frontend takes long to load
**Problem**: Large bundle size

**Solution**:
```powershell
cd client
npm run build
# Check dist/ folder size
```

Optimize:
- Use React.lazy() for code splitting
- Compress images
- Remove unused dependencies

## Development Issues

### ❌ "Hot reload not working"
**Problem**: Vite not detecting changes

**Solution**:
1. Restart dev server
2. Clear browser cache
3. Check file is in `src/` directory
4. Ensure file extension is correct (.jsx not .js)

### ❌ "concurrently: command not found"
**Problem**: Dev dependency not installed

**Solution**:
```powershell
npm install concurrently --save-dev
```

### ❌ Changes not reflecting in database
**Problem**: Caching or transaction issues

**Solution**:
1. Check server console for errors
2. Verify database connection
3. Use database client to verify directly:
   - MongoDB Compass for MongoDB
   - NeonDB web console for PostgreSQL

## Deployment Issues

### ❌ "Build failed" on deployment
**Problem**: Missing environment variables

**Solution**:
1. Set all .env variables in hosting platform
2. Ensure NODE_ENV=production
3. Check build logs for specific error

### ❌ API calls fail after deployment
**Problem**: Wrong API URL

**Solution**:
Update frontend to use production API URL:
```javascript
// In api.js
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend.com/api'
  : '/api';
```

## Browser Issues

### ❌ "CORS policy blocked"
**Problem**: CORS not configured for frontend domain

**Solution**:
Update server CORS:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.com'
  ],
  credentials: true
}));
```

### ❌ Animations not smooth
**Problem**: Browser performance

**Solution**:
1. Disable animations if preferred:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

2. Or reduce animation duration in components

### ❌ Layout broken in browser
**Problem**: CSS not loaded

**Solution**:
1. Hard refresh: Ctrl + Shift + R
2. Clear browser cache
3. Check browser console for CSS errors

## Common Error Messages

### "Error: connect ETIMEDOUT"
**Cause**: Database server unreachable
**Fix**: Check internet connection, firewall settings, database server status

### "ValidationError: Path `email` is required"
**Cause**: Missing required field
**Fix**: Ensure all required fields are provided in request

### "JsonWebTokenError: jwt malformed"
**Cause**: Invalid JWT token format
**Fix**: Logout and login again to get fresh token

### "413 Payload Too Large"
**Cause**: Request body exceeds size limit
**Fix**: Reduce file size or increase server limit

### "ENOENT: no such file or directory"
**Cause**: File path doesn't exist
**Fix**: Check file paths, ensure directories exist

## Getting More Help

### Check Logs

**Backend logs**:
```powershell
# Server console shows all API requests and errors
npm run server
```

**Frontend logs**:
```powershell
# Browser console (F12) shows React errors
```

**Database logs**:
- MongoDB Atlas: Check cluster monitoring
- NeonDB: Check project monitoring

### Debug Mode

Enable detailed error logging:
```javascript
// In server/index.js
app.use((err, req, res, next) => {
  console.error('Full error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

### Reset Everything

Nuclear option - start fresh:
```powershell
# 1. Remove dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules

# 2. Reinstall
npm install
cd client
npm install
cd ..

# 3. Reset database
node server/seed.js

# 4. Start fresh
npm run dev
```

## Still Having Issues?

1. ✅ Check this guide first
2. 📖 Read README.md and SETUP.md
3. 🔍 Search error message online
4. 💬 Check code comments
5. 🐛 Enable debug mode
6. 🔄 Try resetting (see above)

---

**Remember**: Most issues are configuration-related. Double-check .env values!
