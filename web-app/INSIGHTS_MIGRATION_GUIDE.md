# 🔄 REPORTS → INSIGHTS MIGRATION GUIDE

## Overview
This guide covers the complete migration from "Reports" to "Insights" page with the new v3.2 specification.

---

## 📁 FILE CHANGES

### 1. Backend Files to Rename

```bash
# Routes
mv server/routes/report.routes.js server/routes/insights.routes.js

# Controller  
mv server/controllers/report.controller.js server/controllers/insights.controller.js

# Service (if exists)
mv server/services/report.service.js server/services/insights.service.js
```

### 2. Frontend Files to Rename

```bash
# Page Component
mv client/src/pages/Reports.jsx client/src/pages/Insights.jsx

# API Service (update imports only)
# Edit client/src/services/api.js
```

---

## 🔧 CODE CHANGES

### A. Backend Changes

#### 1. `server/index.js` - Update route import

```js
// OLD
const reportRoutes = require('./routes/report.routes');
app.use('/api/reports', reportRoutes);

// NEW
const insightsRoutes = require('./routes/insights.routes');
app.use('/api/insights', insightsRoutes);
```

#### 2. `server/routes/insights.routes.js` - Update all route paths

```js
// OLD
router.get('/analytics', ...)
router.get('/dashboard', ...)

// NEW (no changes needed, just rename file)
// Endpoints become: /api/insights/analytics, /api/insights/dashboard, etc.
```

#### 3. `server/controllers/insights.controller.js` - Add momentum & sparkline data

```js
exports.getAnalytics = async (req, res) => {
  try {
    // ... existing KPI calculations ...
    
    // NEW: Calculate momentum (percentage change from previous period)
    const previousPeriodData = await calculatePreviousPeriod();
    const momentum = {
      revenue: calculatePercentageChange(currentRevenue, previousRevenue),
      invoices: calculatePercentageChange(currentInvoices, previousInvoices),
      items: calculatePercentageChange(currentItems, previousItems),
      customers: calculatePercentageChange(currentCustomers, previousCustomers)
    };
    
    // NEW: Get last 7 days for sparklines
    const sparklineData = {
      revenue: await getLastSevenDays('revenue'),
      invoices: await getLastSevenDays('invoice_count'),
      items: await getLastSevenDays('items_sold'),
      customers: await getLastSevenDays('unique_customers')
    };
    
    res.json({
      success: true,
      data: {
        kpis,
        momentum,        // NEW
        sparklineData,   // NEW
        yearlyRevenue,
        topCustomersByRevenue,
        statusDistribution,
        operationalMetrics
      }
    });
  } catch (error) {
    // ... error handling ...
  }
};

// Helper functions
function calculatePercentageChange(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

async function getLastSevenDays(metric) {
  // Return array of {value: number} for last 7 days
  // Example: [{value: 1200}, {value: 1500}, ...]
}
```

---

### B. Frontend Changes

#### 1. `client/src/App.jsx` - Update route

```jsx
// OLD
import Reports from './pages/Reports';
<Route path="reports" element={<Reports />} />

// NEW
import Insights from './pages/Insights';
<Route path="insights" element={<Insights />} />
```

#### 2. `client/src/components/DashboardLayout.jsx` - Update navigation

```jsx
const navLinks = {
  OWNER: [
    { path: '', label: 'All Invoices', icon: '📋' },
    // ... other links ...
    { path: '/insights', label: 'Insights', icon: '📊' },  // Changed from '/reports'
    // ...
  ],
  ACCOUNTANT: [
    { path: '', label: 'Approved Invoices', icon: '📋' },
    { path: '/insights', label: 'Insights', icon: '📊' },  // Changed
  ]
};
```

#### 3. `client/src/services/api.js` - Update API endpoints

```js
// OLD
export const reportAPI = {
  getAnalytics: (params) => axios.get('/api/reports/analytics', { params }),
  // ...
};

// NEW
export const insightsAPI = {
  getAnalytics: (params) => axios.get('/api/insights/analytics', { params }),
  getDashboard: (params) => axios.get('/api/insights/dashboard', { params }),
  // ... all other endpoints with /api/insights/ prefix
};
```

#### 4. `client/src/pages/Insights.jsx` - Complete rewrite

See the full specification in REPORTS_PAGE_SPEC.md for the new component structure.

**Key Changes:**
- Replace all `className="card"` with `<Card>` components
- Remove emoji icons, use Lucide React
- Implement Sparkline KPI cards
- Use AreaChart for main revenue chart
- Replace customer pie chart with Avatar list
- Use Donut chart for status distribution
- Update all filters to compact header style

---

## 🎨 UI COMPONENT CHANGES

### Key Components to Add

```bash
# Install if not already present
npx shadcn@latest add avatar separator
```

### Import Updates in Insights.jsx

```jsx
// OLD imports
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { RefreshCw, Loader2 } from 'lucide-react';

// NEW imports (additional)
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  RefreshCw, Loader2, TrendingUp, FileText, Package, Users,
  Calendar, Download, BarChart3 
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
```

---

## 🗂️ FILTER IMPROVEMENTS

### Remove "From" and "To" Labels

The spec mentions filters should not have "From" and "To" labels. Update to:

```jsx
// OLD - Separate date inputs with labels
<div>
  <Label>From Date</Label>
  <Input type="date" value={startDate} />
</div>
<div>
  <Label>To Date</Label>
  <Input type="date" value={endDate} />
</div>

// NEW - Single date range selector
<Select value={dateRange} onValueChange={setDateRange}>
  <SelectTrigger className="w-[140px] border-0 focus:ring-0 shadow-none">
    <Calendar className="w-4 h-4 mr-2" />
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="7">Last 7 Days</SelectItem>
    <SelectItem value="30">Last 30 Days</SelectItem>
    <SelectItem value="90">Last Quarter</SelectItem>
    <SelectItem value="365">This Year</SelectItem>
    <SelectItem value="all">All Time</SelectItem>
  </SelectContent>
</Select>
```

---

## 🧪 TESTING CHECKLIST

After migration, test:

- [ ] `/api/insights/analytics` returns data correctly
- [ ] All old `/api/reports/*` endpoints return 404 or redirect
- [ ] Navigation link goes to `/dashboard/insights`
- [ ] Page title shows "Intelligence Hub"
- [ ] KPI cards show sparklines
- [ ] KPI cards show momentum badges (+X% or -X%)
- [ ] Revenue chart is AreaChart with gradient
- [ ] Customer list shows avatars (not pie chart)
- [ ] Status shows donut chart with center total
- [ ] All numbers use `font-mono`
- [ ] No emoji icons anywhere
- [ ] No gradient backgrounds on cards
- [ ] Filters work correctly
- [ ] Export button (Download icon) is present
- [ ] Loading state shows skeleton
- [ ] Empty state shows proper icons
- [ ] Dark mode works
- [ ] Mobile responsive (all collapses to 1 column)

---

## 📝 DATABASE CHANGES (if needed)

If you have any hardcoded references in the database:

```sql
-- Update any audit logs or references
UPDATE audit_logs 
SET page_accessed = 'INSIGHTS' 
WHERE page_accessed = 'REPORTS';

-- Update any user preferences
UPDATE user_preferences 
SET default_page = '/dashboard/insights' 
WHERE default_page = '/dashboard/reports';
```

---

## 🚀 DEPLOYMENT STEPS

1. **Backup current code**
   ```bash
   git checkout -b backup/reports-to-insights
   git push origin backup/reports-to-insights
   ```

2. **Create migration branch**
   ```bash
   git checkout -b feature/insights-migration
   ```

3. **Make all file changes**
   - Rename backend files
   - Rename frontend files
   - Update all imports
   - Update all route references

4. **Update API responses**
   - Add momentum calculations
   - Add sparkline data
   - Test all endpoints

5. **Rebuild frontend component**
   - Follow REPORTS_PAGE_SPEC.md v3.2
   - Test each section incrementally

6. **Test thoroughly**
   - Run all tests in checklist above
   - Test with real data
   - Test edge cases (no data, loading, errors)

7. **Deploy**
   ```bash
   git add .
   git commit -m "feat: Migrate Reports to Insights with v3.2 spec"
   git push origin feature/insights-migration
   ```

---

## ⚠️ POTENTIAL ISSUES

### Issue 1: Cached API Calls
**Problem**: Old `/api/reports/` calls might be cached
**Solution**: Clear browser cache or add cache-busting parameter

### Issue 2: Third-party Integrations
**Problem**: External services calling `/api/reports/`
**Solution**: Keep old routes as aliases for 1-2 releases
```js
// In server/index.js
app.use('/api/reports', insightsRoutes); // Alias for backward compatibility
app.use('/api/insights', insightsRoutes);
```

### Issue 3: Bookmarked URLs
**Problem**: Users have `/dashboard/reports` bookmarked
**Solution**: Add redirect in App.jsx
```jsx
<Route path="reports" element={<Navigate to="/dashboard/insights" replace />} />
```

---

## 📊 EXPECTED OUTCOME

After completing this migration:

✅ Page accessed via `/dashboard/insights`
✅ API called via `/api/insights/*`
✅ Modern "Intelligence Hub" design
✅ Sparkline KPI cards with momentum
✅ AreaChart with gradient fill
✅ Avatar-based customer list
✅ Donut chart with center total
✅ No emojis, no gradients
✅ Fully responsive
✅ WCAG AA compliant
✅ Dark mode supported

---

**Migration Version**: 1.0
**Target Spec**: v3.2
**Estimated Time**: 4-6 hours
**Last Updated**: February 8, 2026
