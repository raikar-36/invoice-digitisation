# 📊 SMART INVOICE - INSIGHTS PAGE SPECIFICATION v3.2
## INTELLIGENCE HUB | BENTO GRID | DATA VISUALIZATION REFINED

---

## 📋 OVERVIEW

The **Insights** page (formerly Reports) is a Predictive Intelligence Hub that gives the **Owner** and **Accountant** an immediate pulse of the business. It uses a human-centric 7-column Bento Grid to prioritize data by importance rather than just fitting boxes.

**Access**: Owner + Accountant roles only
**Route**: `/dashboard/insights`
**API Endpoints**: `/api/insights/*` (formerly `/api/reports/*`)

---

## 🧱 THE 7-COLUMN BENTO LAYOUT

### Architecture
The page uses a 7-column grid on desktop to prioritize data by importance:

```jsx
<div className="space-y-6">
  {/* Row 1: KPI Sparklines (4 cards) */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* 4 Smart KPI Cards with mini sparklines */}
  </div>

  {/* Row 2: Revenue Intelligence + Client Leaderboard */}
  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
    <Card className="col-span-7 lg:col-span-5">
      {/* Main Revenue Area Chart */}
    </Card>
    <Card className="col-span-7 lg:col-span-2">
      {/* Top Customers List with Avatars */}
    </Card>
  </div>

  {/* Row 3: Invoice Breakdown + Operational Health */}
  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
    <Card className="col-span-7 lg:col-span-3">
      {/* Status Donut Chart */}
    </Card>
    <Card className="col-span-7 lg:col-span-4">
      {/* Operational Metrics Cards */}
    </Card>
  </div>
</div>
```

**Layout Principles:**
- **Row 1**: KPI Sparklines - 4 equal cards showing momentum, not just totals
- **Row 2**: Revenue (5 cols) + Customers (2 cols) - Main focus area
- **Row 3**: Status Distribution (3 cols) + Operations (4 cols)
- **Mobile**: All collapse to 1 column with proper spacing
- **Tablet**: 2 columns for KPIs, full width for charts

---

## 🧩 REQUIRED COMPONENTS

### 1. Shadcn/UI Components
```bash
npx shadcn@latest add card button select input label
```

**Usage:**
- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>` - For all containers
- `<Button>` - For refresh and filter actions
- `<Select>`, `<SelectTrigger>`, `<SelectValue>`, `<SelectContent>`, `<SelectItem>` - For dropdowns
- `<Input>` - For date inputs
- `<Label>` - For form labels

### 2. Lucide React Icons
```bash
npm install lucide-react
```

**Required Icons:**
- `RefreshCw` - Refresh button
- `TrendingUp` - Revenue metrics
- `Users` - Customer count
- `FileText` - Invoice count
- `Package` - Items sold
- `Calendar` - Date filters
- `BarChart3` - Chart indicators
- `Loader2` - Loading states (with `animate-spin`)

**❌ NO EMOJIS** - All icons must be from Lucide React, not emoji characters (👥, 📊, 💰, 📦)

### 3. Chart Library
```bash
npm install recharts
```

**Chart Components:**
- `<BarChart>` - For yearly/monthly data
- `<LineChart>` - For daily trends
- `<PieChart>` - For top customers distribution
- `<ResThe "Intelligence" Header

**Compact & Integrated Filters**

```jsx
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Intelligence Hub</h1>
    <p className="text-muted-foreground">
      Real-time financial performance and audit overview
    </p>
  </div>
  
  {/* Compact Filter Bar */}
  <div className="flex items-center gap-2 bg-background border rounded-xl shadow-sm p-1">
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
    
    <Separator orientation="vertical" className="h-6" />
    
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-lg"
      onClick={handleRefresh}
      disabled={refreshing}
    >
      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
    </Button>
    
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-lg"
      onClick={handleExport}
    >
      <Download className="w-4 h-4" />
    </Button>
  </div>
</div>
```

**Styling Notes:**
- Filters are in a pill-style container with `rounded-xl`
- No separate filter card - everything in the header
- Icons are `w-4 h-4` for compact look
- Use `border-0` and `shadow-none` on Select trigger for seamless look
```

**Styling:**
- Use `text-3xl font-semibold tracking-tight` for h1
- Use `text-muted-foreground` for descriptions
- Button should have proper icon sizing (`w-5 h-5`)

---

### 2. Filters Section

```jsx
<Car2. The "Smart" KPI Card (with Sparklines)

**Redesigned to show momentum, not just totals**

```jsx
<Card className="overflow-hidden border-slate-200/60 dark:border-slate-800/60">
  <CardContent className="p-6">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold font-mono tracking-tight">
            ₹{parseFloat(data?.kpis?.total_revenue || 0).toLocaleString('en-IN')}
          </h3>
          {/* Momentum Indicator */}
          {data?.momentum?.revenue && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              data.momentum.revenue > 0 
                ? 'text-emerald-500 bg-emerald-500/10' 
                : 'text-rose-500 bg-rose-500/10'
            }`}>
              {data.momentum.revenue > 0 ? '+' : ''}{data.momentum.revenue}%
            </span>
          )}
        </div>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg">
        <TrendingUp className="w-4 h-4 text-primary" />
      </div>
    </div>
    
    {/* Mini Trend Sparkline */}
    <div className="h-[40px] mt-4 -mx-2 opacity-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data?.sparklineData?.revenue || []}>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary))" 
            fillOpacity={0.1} 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

**KPI Card Specifications:**
- **Value**: Use `font-mono` for all numbers (₹ amounts, counts)
- **Momentum Badge**: 
  - Green `bg-emerald-500/10 text-emerald-500` for positive
  - Red `bg-rose-500/10 text-rose-500` for negative
  - Font size: `text-[10px]` for compactness
- **Sparkline**:
  - Height: `40px` fixed
  - Opacity: `0.6` for subtle effect
  - No axes, no grid, no dots
  - Use `fillOpacity={0.1}` for gradient effect
  - Set `isAnimationActive={false}` for instant rendering
- **Icon Circle**: `bg-primary/10` with `rounded-lg` and `p-2`
- **Border**: Subtle `border-slate-200/60 dark:border-slate-800/60`

**Four KPI Cards:**
1. **Total Revenue** - `TrendingUp` icon, primary color
2. **Total Invoices** - `FileText` icon, blue color
3. **Items Sold** - `Package` icon, emerald color  
4. **Unique Customers** - `Users` icon, purple color
        <Package className="h-8 w-8 text-blue-500" />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Unique Customers
          </p>
          <p className="text-3xl font-bold">
            {data?.kpis?.unique_customers || 0}
          </p>
        </div>
        <Users className="h-8 w-8 text-purple-500" />
      </div>
    </CardContent>
  </Card>
</div>
```

**KPI Card Styling:**
- Use proper `<Card>` component (not `className="card"`)
- **NO gradient backgrounds** (remove `bg-gradient-to-br`)
- Use Lucide icons with semantic colors:
  - `FileText` with `text-primary` for invoices
  - `TrendingUp` with `text-emerald-500` for revenue
  - `Package` with `text-blue-500` for items
  - `Users` with `text-purple-500` for customers
- Text hierarchy:
  - Label: `text-sm font-medium text-muted-foreground`
  - Value: `text-3xl font-bold`
- Icon size: `h-8 w-8` (larger for emphasis)

---

### 3. Main Revenue Intelligence Chart (The "Hero" Chart)

**Modern Area Chart with Gradient Fill**

```jsx
<Card className="col-span-7 lg:col-span-5">
  <CardHeader>
    <CardTitle>Revenue Trend</CardTitle>
    <CardDescription>Monthly revenue performance</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data?.yearlyRevenue || []}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="4 4" 
          stroke="hsl(var(--border))" 
          vertical={false}
          opacity={0.3}
        />
        
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
        />
        
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          fill="url(#revenueGradient)" 
          activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

// Custom Glass Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border shadow-xl rounded-lg p-3">
        <p className="text-sm font-medium">{payload[0].payload.month}</p>
        <p className="text-lg font-bold font-mono text-primary">
          ₹{parseFloat(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};
```

**Hero Chart Specifications:**
- **Stroke**: `hsl(var(--primary))` with `strokeWidth={3}`
- **Fill**: Linear gradient from primary to transparent
- **Grid**: Horizontal only (`vertical={false}`), very faint with opacity
- **Axes**: No axis lines, no tick lines, small font size
- **Tooltip**: Glass effect with `backdrop-blur-md` and `bg-white/80`
- **Active Dot**: Radius 6, no stroke, filled with primary color
- **Height**: `350px` for main chart
- **Y-Axis**: Format as `₹{value}K` for thousands

### 4. Client Leaderboard (Humanized List)

**R 5. Invoice Status Breakdown (Modern Donut Chart)

**Use Donut instead of Pie, with center total**

```jsx
<Card className="col-span-7 lg:col-span-3">
  <CardHeader>
    <CardTitle className="text-base">Invoice Status Distribution</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          content={({ payload }) => {
            if (payload && payload.length) {
              return (
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border shadow-xl rounded-lg p-3">
                  <p className="text-sm font-medium">{payload[0].name}</p>
                  <p className="text-lg font-bold">{payload[0].value} invoices</p>
                </div>
              );
            }
            return null;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
    
    {/* Center Total - Positioned Absolutely */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <p className="text-3xl font-bold font-mono">
          {statusData.reduce((sum, item) => sum + item.value, 0)}
        </p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
    </div>
    
    {/* Legend */}
    <div className="grid grid-cols-2 gap-4 mt-4">
      {statusData.map((status, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: status.color }}
          />
          <span className="text-sm text-muted-foreground">{status.name}</span>
        </div
**Pie Chart Colors:**
```js
const COLORS = [
  'hsl(var(--primary))',      // Primary blue
  'hsl(142 71% 45%)',         // Emerald-500
  'hsl(48 96% 53%)',          // Amber-500
  'hsl(0 84% 60%)',           // Rose-500
  'hsl(262 83% 58%)',         // Purple-500
  'hsl(330 81% 60%)',         // Pink-500
  'hsl(199 89% 48%)',         // Cyan-500
  'hsl(84 81% 44%)'           // Lime-500
];
```

#### Line Chart (Daily Trend)
```jsx
<Card>
  <CardHeader>
    <CardTitle>Daily Invoice Trend (Current Month)</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.dailyTrend}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="hsl(199 89% 48%)" 
          strokeWidth={2} 
          dot={{ fill: 'hsl(199 89% 48%)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Line Chart Styling:**
- Use cyan color for line: `hsl(199 89% 48%)`
- Line width: `strokeWidth={2}`
- Show dots on data points
- Type: `monotone` for smooth curves

      ))}
    </div>
  </CardContent>
</Card>
```

**Donut Chart Specifications:**
- **Inner Radius**: `60` for donut effect
- **Outer Radius**: `90`
- **Padding Angle**: `2` for small gap between segments
- **Center Total**: Positioned absolutely in the center with `text-3xl font-bold font-mono`
- **Colors**: Use semantic colors matching status badges
  - Approved: `hsl(142 71% 45%)` (Emerald)
  - Pending Review: `hsl(48 96% 53%)` (Amber)
  - Pending Approval: `hsl(221 83% 53%)` (Blue)
  - Rejected: `hsl(0 84% 60%)` (Rose)
- **Legend**: 2-column grid below chart with colored dots

---

### 6. Operational Health Metrics

**Clean, bordered metric cards - no colored backgrounds**

```jsx
<Card className="col-span-7 lg:col-span-4">
  <CardHeader>
    <CardTitle className="text-base">Operational Metrics</CardTitle>
    <CardDescription>Business health indicators</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Avg Items Per Invoice
          </p>
        </div>
        <p className="text-2xl font-bold font-mono">
          {parseFloat(data?.operationalMetrics?.avgItemsPerInvoice || 0).toFixed(1)}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Busiest Day
          </p>
        </div>
        <p className="text-2xl font-bold">
          {data?.operationalMetrics?.busiestDay || 'N/A'}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Most Active Customer
          </p>
        </div>
        <p className="text-2xl font-bold truncate">
          {data?.operationalMetrics?.mostActiveCustomer || 'N/A'}
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

**Metric Box Specifications:**
- Use `rounded-lg border bg-card p-4` - subtle bordered boxes
- **NO colored backgrounds** (no `bg-blue-50`, `bg-green-50`)
- Icon + label in a flex row: `flex items-center gap-2`
- Icons are small: `w-4 h-4 text-muted-foreground`
- Spacing: `space-y-2` between label and value
- Value: `text-2xl font-bold`, use `font-mono` for numbers
- Truncate long customer names with `truncate`

---

## 📊 STATUS COLORS & CHART PALETTE

### Status Colors (for Donut Chart)
```js
const STATUS_COLORS = {
  APPROVED: 'hsl(142 71% 45%)',           // Emerald-500
  PENDING_REVIEW: 'hsl(48 96% 53%)',     // Amber-500
  PENDING_APPROVAL: 'hsl(221 83% 53%)',  // Blue-500
  REJECTED: 'hsl(0 84% 60%)'             // Rose-500
};
```

### General Chart Palette (for misc charts)
```js
const CHART_COLORS = [
  'hsl(var(--primary))',      // Primary blue
  'hsl(142 71% 45%)',         // Emerald-500
  'hsl(48 96% 53%)',          // Amber-500
  'hsl(0 84% 60%)',           // Rose-500
  'hsl(262 83% 58%)',         // Purple-500
  'hsl(330 81% 60%)',         // Pink-500
  'hsl(199 89% 48%)',         // Cyan-500
  'hsl(84 81% 44%)'           // Lime-500
];
```

---

### Entry Animations (Framer Motion)

```jsx
import { motion } from 'framer-motion';

// Stagger effect for KPI cards
{kpiCards.map((card, index) => (
  <motion.div
    key={card.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card>{/* Card content */}</Card>
  </motion.div>
))}
```

**Animation Guidelines:**
- Use subtle animations: `y: 20` for entry
- Stagger with `delay: index * 0.1`
- Keep transitions short (default duration)
- Only animate on initial load

---

## 🚫 WHAT TO REMOVE (CLEANUP CHECKLIST)

### ❌ Remove These Patterns:

1. **Gradient Backgrounds on KPI Cards**
   ```jsx
   // ❌ Wrong
   className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
   
   // ✅ Correct
   <Card className="border-slate-200/60 dark:border-slate-800/60">
   ```

2. **Emoji Icons**
   ```jsx
   // ❌ Wrong
   <p className="text-xs opacity-75 mt-2">📊 Invoice Count</p>
   
   // ✅ Correct
   <FileText className="w-4 h-4 text-primary" />
   ```

3. **Static Zeros in Charts**
   ```jsx
   // ❌ Wrong - Shows "0" on empty chart
   <Bar dataKey="count" />
   
   // ✅ Correct - Show "No Data" overlay
   {data.length === 0 ? (
     <NoDataOverlay />
   ) : (
     <Bar dataKey="count" />
   )}
   ```

4. **Separate Filter Card**
   ```jsx
   // ❌ Wrong - Filters in separate card below header
   <Card className="mb-8">
     <CardContent>{/* filters */}</CardContent>
   </Card>
   
   // ✅ Correct - Filters integrated in header
   <div className="flex items-center gap-2 border rounded-xl p-1">
     {/* compact filters */}
   </div>
   ```

5. **Using `className="card"` instead of `<Card>`**
   ```jsx
   // ❌ Wrong
   <div className="card">
   
   // ✅ Correct
   <Card>
   ```

6. **Solid Pie Charts**
   ```jsx
   // ❌ Wrong
   <Pie outerRadius={100} />
   
   // ✅ Correct - Use Donut
   <Pie innerRadius={60} outerRadius={90} />
   ```

7. **Arbitrary Color Codes**
   ```jsx
   // ❌ Wrong
   fill="#4F46E5"
   
   // ✅ Correct
   fill="hsl(var(--primary))"
   ```

8. **Large Emojis in Empty States**
   ```jsx
   // ❌ Wrong
   <div className="text-6xl">📊</div>
   
   // ✅ Correct
   <BarChart3 className="w-16 h-16 text-muted-foreground" />
   ```

---

## ♿ ACCESSIBILITY

### Focus States
All interactive elements must have visible focus states:
```jsx
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

### Aria Labels
```jsx
<Button aria-label="Refresh analytics data" onClick={handleRefresh}>
  <RefreshCw className="w-5 h-5" />
</Button>
```

### Color Contrast
- All text must meet WCAG AA standards
- Use `text-muted-foreground` (minimum 4.5:1 contrast)
- Charts should have clear labels and tooltips

### Keyboard Navigation
- Tab through all filters and buttons
- Enter to submit forms
- Escape to close modals/tooltips

---

## 📐 RESPONSIVE BREAKPOINTS

```jsx
// Mobile (default)
grid-cols-1

// Tablet (md: 768px+)
md:grid-cols-2

// Desktop (lg: 1024px+)
lg:grid-cols-4    // For KPI cards
lg:grid-cols-7    // For Bento Grid
```

---

## 🔧 LOADING & ERROR STATES

### Loading State
```jsx
if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
```

### Error State
```jsx
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

### Empty State (No Data)
```jsx
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
    <p className="text-lg font-medium mb-2">No Data Available</p>
    <p className="text-sm text-muted-foreground">
      There might be no approved invoices yet.
    </p>
  </CardContent>
</Card>
```

---

## 📊 REQUIRED DATA STRUCTURE

### API Response Format (`/api/insights/analytics`)

```typescript
{
  success: boolean;
  data: {
    // KPIs with momentum
    kpis: {
      total_invoices: number;
      total_revenue: number;
      total_items_sold: number;
      unique_customers: number;
    };
    
    // Momentum indicators (percentage change)
    momentum: {
      invoices: number;      // e.g., +5.2 or -2.1
      revenue: number;
      items: number;
      customers: number;
    };
    
    // Sparkline data (last 7 days mini trends)
    sparklineData: {
      revenue: Array<{ value: number }>;
      invoices: Array<{ value: number }>;
      items: Array<{ value: number }>;
      customers: Array<{ value: number }>;
    };
    
    // Main revenue chart (12 months)
    yearlyRevenue: Array<{ 
      month: string;      // "Jan", "Feb", etc.
      revenue: number;
    }>;
    
    // Top customers
    topCustomersByRevenue: Array<{ 
      name: string;
      value: number;      // Total revenue
      count: number;      // Invoice count
    }>;
    
    // Status distribution
    statusDistribution: {
      approved: number;
      pending_review: number;
      pending_approval: number;
      rejected: number;
    };
    
    // Operational metrics
    operationalMetrics: {
      avgItemsPerInvoice: number;
      busiestDay: string;           // "Monday", "Tuesday", etc.
      mostActiveCustomer: string;   // Customer name
    };
  };
}
```

---

## 🎨 COMPLETE EXAMPLE

```jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { RefreshCw, TrendingUp, FileText, Package, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 71% 45%)',
  'hsl(48 96% 53%)',
  'hsl(0 84% 60%)',
  'hsl(262 83% 58%)',
  'hsl(330 81% 60%)',
  'hsl(199 89% 48%)',
  'hsl(84 81% 44%)'
];

const Reports = () => {
  // ... state and logic ...

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and metrics
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        {/* Filter content */}
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI card components */}
      </div>

      {/* Bento Grid for Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
        {/* Charts */}
      </div>

      {/* Operational Metrics */}
      <Card>
        {/* Metrics content */}
      </Card>
    </div>
  );
};

export default Reports;
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Rename & Route Changes
- [ ] Rename `/api/reports/*` routes to `/api/insights/*`
- [ ] Rename `server/routes/report.routes.js` to `insights.routes.js`
- [ ] Rename `server/controllers/report.controller.js` to `insights.controller.js`
- [ ] Update all API imports in frontend
- [ ] Change route in App.jsx from `/dashboard/reports` to `/dashboard/insights`
- [ ] Update navigation links in DashboardLayout.jsx
- [ ] Rename component file from `Reports.jsx` to `Insights.jsx`

### Phase 2: UI Component Updates
- [ ] Replace all `className="card"` with proper `<Card>` components
- [ ] Remove ALL emoji icons, replace with Lucide React icons
- [ ] Remove ALL gradient backgrounds (`bg-gradient-to-br`)
- [ ] Implement Sparkline KPI cards with momentum indicators
- [ ] Add `font-mono` to all numerical values
- [ ] Update header to "Intelligence Hub" with compact filters

### Phase 3: Chart Redesign
- [ ] Replace Bar charts with AreaChart for revenue (with gradient)
- [ ] Replace Pie chart customer view with Avatar-based list
- [ ] Convert status Pie to Donut with center total
- [ ] Implement glass tooltip (`backdrop-blur-md`)
- [ ] Remove vertical grid lines, keep horizontal only
- [ ] Use theme-aware colors (`hsl(var(--primary))`)
- [ ] Add empty state overlays for charts with no data

### Phase 4: Data & API
- [ ] Update API response to include `momentum` field
- [ ] Update API response to include `sparklineData` field
- [ ] Ensure all colors use HSL format in responses
- [ ] Add date range filter logic (remove "From" and "To" labels)
- [ ] Implement export functionality (Download button)

### Phase 5: Polish & Testing
- [ ] Test responsive layout on mobile (all columns collapse to 1)
- [ ] Verify dark mode for all components
- [ ] Test loading states with Skeleton
- [ ] Verify empty states show proper icons
- [ ] Check accessibility (focus visible, aria labels)
- [ ] Test filter functionality
- [ ] Verify all animations are subtle

---

**Last Updated**: February 8, 2026  
**Status**: Specification Complete - Requires Implementation
