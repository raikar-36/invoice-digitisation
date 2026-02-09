import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import axios from 'axios';
import { 
  AreaChart, Area, PieChart, Pie, Cell, Label as RechartsLabel,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Button 
} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  FileText, 
  Package, 
  Users,
  Calendar,
  Download
} from 'lucide-react';

const STATUS_COLORS = {
  APPROVED: 'hsl(142 71% 45%)',      // Emerald
  PENDING_REVIEW: 'hsl(43 96% 56%)', // Amber
  PENDING_APPROVAL: 'hsl(262 83% 58%)', // Purple
  REJECTED: 'hsl(0 84% 60%)'         // Rose
};

// Custom Glass Tooltip for Area Chart
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

const Insights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = { year: selectedYear };
      
      // Check if custom dates are set
      if (customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      } else if (dateRange !== 'all') {
        // Use preset range
        params.preset = dateRange;
      } else {
        // All time
        params.preset = '0';
      }

      const response = await axios.get('/api/insights/analytics', { 
        params,
        withCredentials: true 
      });
      
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    // Clear custom dates when switching to preset
    if (value !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
    // Auto-reload if not custom
    if (value !== 'custom') {
      setTimeout(loadAnalytics, 100);
    }
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      loadAnalytics();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    if (!data) return;
    
    try {
      // Determine date range
      let dateRangeText = '';
      const today = new Date();
      
      if (customStart && customEnd) {
        dateRangeText = `Date Range: ${format(new Date(customStart), 'dd/MM/yyyy')} to ${format(new Date(customEnd), 'dd/MM/yyyy')}`;
      } else if (dateRange === '7') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else if (dateRange === '30') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else if (dateRange === '90') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else if (dateRange === '365') {
        const startDate = new Date(today.getFullYear(), 0, 1);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else {
        dateRangeText = 'Date Range: All Time';
      }
      
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Invoice Analytics Report', margin, yPos);
      yPos += 10;
      
      // Date Range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, margin, yPos);
      yPos += 5;
      doc.text(dateRangeText, margin, yPos);
      yPos += 12;
      
      // KPIs Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Key Performance Indicators', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const kpis = [
        ['Total Revenue', `Rs. ${parseFloat(data?.kpis?.total_revenue || 0).toLocaleString('en-IN')}`],
        ['Total Invoices', data?.kpis?.total_invoices || 0],
        ['Items Sold', data?.kpis?.total_items_sold || 0],
        ['Unique Customers', data?.kpis?.unique_customers || 0],
        ['Avg Items Per Invoice', parseFloat(data?.operationalMetrics?.avgItemsPerInvoice || 0).toFixed(2)],
        ['Busiest Day', data?.operationalMetrics?.busiestDay || 'N/A'],
        ['Most Active Customer', data?.operationalMetrics?.mostActiveCustomer || 'N/A']
      ];
      
      kpis.forEach(([label, value]) => {
        doc.text(`${label}:`, margin, yPos);
        doc.text(String(value), margin + 70, yPos);
        yPos += 5;
      });
      
      yPos += 3;
      
      // Momentum Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Momentum (%)', margin, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const momentum = [
        ['Revenue', `${data?.momentum?.revenue || 0}%`],
        ['Invoices', `${data?.momentum?.invoices || 0}%`],
        ['Items', `${data?.momentum?.items || 0}%`],
        ['Customers', `${data?.momentum?.customers || 0}%`]
      ];
      
      momentum.forEach(([label, value]) => {
        doc.text(`${label}:`, margin, yPos);
        doc.text(value, margin + 70, yPos);
        yPos += 5;
      });
      
      yPos += 3;
      
      // Top Customers Section
      if (data?.topCustomersByRevenue?.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Customers by Revenue', margin, yPos);
        yPos += 7;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        data.topCustomersByRevenue.slice(0, 10).forEach((customer, idx) => {
          const text = `${idx + 1}. ${customer.name} - Rs. ${customer.value.toLocaleString('en-IN')} (${customer.count} invoices)`;
          doc.text(text, margin, yPos);
          yPos += 4.5;
        });
        
        yPos += 3;
      }
      
      // Status Distribution Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Status Distribution', margin, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(data?.statusDistribution || {}).forEach(([status, count]) => {
        doc.text(`${status.replace('_', ' ').toUpperCase()}:`, margin, yPos);
        doc.text(String(count), margin + 70, yPos);
        yPos += 5;
      });
      
      yPos += 3;
      
      // Monthly Revenue Section (2 columns to save space)
      if (data?.yearlyRevenue?.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Revenue Trend', margin, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Split into 2 columns (6 months each)
        const col1Data = data.yearlyRevenue.slice(0, 6);
        const col2Data = data.yearlyRevenue.slice(6, 12);
        const col2X = pageWidth / 2 + 10;
        
        let col1Y = yPos;
        let col2Y = yPos;
        
        col1Data.forEach((item) => {
          doc.text(`${item.month}:`, margin, col1Y);
          doc.text(`Rs. ${item.revenue.toLocaleString('en-IN')}`, margin + 25, col1Y);
          col1Y += 5;
        });
        
        col2Data.forEach((item) => {
          doc.text(`${item.month}:`, col2X, col2Y);
          doc.text(`Rs. ${item.revenue.toLocaleString('en-IN')}`, col2X + 25, col2Y);
          col2Y += 5;
        });
      }
      
      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`invoice-analytics-${timestamp}.pdf`);
      
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    try {
      // Determine date range
      let dateRangeText = '';
      const today = new Date();
      
      if (customStart && customEnd) {
        dateRangeText = `Date Range: ${format(new Date(customStart), 'dd/MM/yyyy')} to ${format(new Date(customEnd), 'dd/MM/yyyy')}`;
      } else if (dateRange === '7') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else if (dateRange === '30') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else if (dateRange === '90') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else if (dateRange === '365') {
        const startDate = new Date(today.getFullYear(), 0, 1);
        dateRangeText = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`;
      } else {
        dateRangeText = 'Date Range: All Time';
      }
      
      // Prepare export data
      const exportData = {
        summary: {
          'Total Revenue': `"Rs.${parseFloat(data?.kpis?.total_revenue || 0).toLocaleString('en-IN')}"`,
          'Total Invoices': data?.kpis?.total_invoices || 0,
          'Items Sold': data?.kpis?.total_items_sold || 0,
          'Unique Customers': data?.kpis?.unique_customers || 0,
          'Avg Items Per Invoice': parseFloat(data?.operationalMetrics?.avgItemsPerInvoice || 0).toFixed(2),
          'Busiest Day': data?.operationalMetrics?.busiestDay || 'N/A',
          'Most Active Customer': data?.operationalMetrics?.mostActiveCustomer || 'N/A'
        },
        momentum: data?.momentum || {},
        topCustomers: data?.topCustomersByRevenue || [],
        statusDistribution: data?.statusDistribution || {},
        monthlyRevenue: data?.yearlyRevenue || []
      };
      
      // Convert to CSV format with UTF-8 BOM for proper encoding
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += 'Smart Invoice Analytics Export\n';
      csv += `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}\n`;
      csv += `${dateRangeText}\n\n`;
      
      // Summary Section
      csv += 'KEY PERFORMANCE INDICATORS\n';
      Object.entries(exportData.summary).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
      
      csv += '\nMOMENTUM (%)\n';
      csv += 'Metric,Change\n';
      csv += `Revenue,${exportData.momentum.revenue || 0}%\n`;
      csv += `Invoices,${exportData.momentum.invoices || 0}%\n`;
      csv += `Items,${exportData.momentum.items || 0}%\n`;
      csv += `Customers,${exportData.momentum.customers || 0}%\n`;
      
      // Top Customers
      csv += '\nTOP CUSTOMERS BY REVENUE\n';
      csv += 'Customer Name,Total Revenue,Invoice Count\n';
      exportData.topCustomers.forEach(customer => {
        csv += `${customer.name},"Rs.${customer.value.toLocaleString('en-IN')}",${customer.count}\n`;
      });
      
      // Status Distribution
      csv += '\nINVOICE STATUS DISTRIBUTION\n';
      csv += 'Status,Count\n';
      Object.entries(exportData.statusDistribution).forEach(([status, count]) => {
        csv += `${status.replace('_', ' ').toUpperCase()},${count}\n`;
      });
      
      // Monthly Revenue
      csv += '\nMONTHLY REVENUE TREND\n';
      csv += 'Month,Revenue\n';
      exportData.monthlyRevenue.forEach(item => {
        csv += `${item.month},"Rs.${item.revenue.toLocaleString('en-IN')}"\n`;
      });
      
      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `invoice-analytics-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-xl text-muted-foreground mb-2">No analytics data available</p>
        <p className="text-sm text-muted-foreground">There might be no approved invoices yet.</p>
      </div>
    );
  }

  // Prepare status distribution data for donut chart
  const statusData = [
    { name: 'Approved', value: data.statusDistribution?.approved || 0, color: STATUS_COLORS.APPROVED },
    { name: 'Pending Review', value: data.statusDistribution?.pending_review || 0, color: STATUS_COLORS.PENDING_REVIEW },
    { name: 'Pending Approval', value: data.statusDistribution?.pending_approval || 0, color: STATUS_COLORS.PENDING_APPROVAL },
    { name: 'Rejected', value: data.statusDistribution?.rejected || 0, color: STATUS_COLORS.REJECTED }
  ];

  const totalInvoices = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Header with Compact Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Hub</h1>
          <p className="text-muted-foreground">
            Real-time financial performance and audit overview
          </p>
        </div>
        
        {/* Compact Filter Bar */}
        <div className="flex items-center gap-2 bg-background border rounded-xl shadow-sm p-1">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
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
              <SelectItem value="custom">Custom Range</SelectItem>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-lg"
              >
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Custom Date Range Inputs (Conditional) */}
      {dateRange === 'custom' && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="start-date">From</Label>
                <DatePicker
                  value={customStart}
                  onChange={(date) => setCustomStart(date)}
                  placeholder="Select start date"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date">To</Label>
                <DatePicker
                  value={customEnd}
                  onChange={(date) => setCustomEnd(date)}
                  placeholder="Select end date"
                />
              </div>
              <Button onClick={handleCustomDateApply} disabled={!customStart || !customEnd}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 1: KPI Sparklines (4 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue KPI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold font-mono tracking-tight">
                      ₹{parseFloat(data?.kpis?.total_revenue || 0).toLocaleString('en-IN')}
                    </h3>
                    {data?.momentum?.revenue != null && (
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
              {data?.sparklineData?.revenue && (
                <div className="h-[40px] mt-4 -mx-2 opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sparklineData.revenue}>
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
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Invoices KPI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold font-mono tracking-tight">
                      {data?.kpis?.total_invoices || 0}
                    </h3>
                    {data?.momentum?.invoices != null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        data.momentum.invoices > 0 
                          ? 'text-emerald-500 bg-emerald-500/10' 
                          : 'text-rose-500 bg-rose-500/10'
                      }`}>
                        {data.momentum.invoices > 0 ? '+' : ''}{data.momentum.invoices}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              
              {/* Mini Trend Sparkline */}
              {data?.sparklineData?.invoices && (
                <div className="h-[40px] mt-4 -mx-2 opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sparklineData.invoices}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(221 83% 53%)" 
                        fill="hsl(221 83% 53%)" 
                        fillOpacity={0.1} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Items Sold KPI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold font-mono tracking-tight">
                      {data?.kpis?.total_items_sold || 0}
                    </h3>
                    {data?.momentum?.items != null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        data.momentum.items > 0 
                          ? 'text-emerald-500 bg-emerald-500/10' 
                          : 'text-rose-500 bg-rose-500/10'
                      }`}>
                        {data.momentum.items > 0 ? '+' : ''}{data.momentum.items}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Package className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              
              {/* Mini Trend Sparkline */}
              {data?.sparklineData?.items && (
                <div className="h-[40px] mt-4 -mx-2 opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sparklineData.items}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(142 71% 45%)" 
                        fill="hsl(142 71% 45%)" 
                        fillOpacity={0.1} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Unique Customers KPI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Unique Customers</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold font-mono tracking-tight">
                      {data?.kpis?.unique_customers || 0}
                    </h3>
                    {data?.momentum?.customers != null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        data.momentum.customers > 0 
                          ? 'text-emerald-500 bg-emerald-500/10' 
                          : 'text-rose-500 bg-rose-500/10'
                      }`}>
                        {data.momentum.customers > 0 ? '+' : ''}{data.momentum.customers}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              
              {/* Mini Trend Sparkline */}
              {data?.sparklineData?.customers && (
                <div className="h-[40px] mt-4 -mx-2 opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sparklineData.customers}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(262 83% 58%)" 
                        fill="hsl(262 83% 58%)" 
                        fillOpacity={0.1} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2: Revenue Intelligence + Client Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Main Revenue Area Chart */}
        <Card className="col-span-7 lg:col-span-5">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance for {selectedYear}</CardDescription>
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

        {/* Top Customers List with Avatars */}
        <Card className="col-span-7 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
            <CardDescription>By revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topCustomersByRevenue && data.topCustomersByRevenue.length > 0 ? (
                data.topCustomersByRevenue.map((customer, index) => (
                  <div key={customer.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.count} invoices</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono">
                        ₹{(customer.value / 1000).toFixed(2)}K
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No customer data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Invoice Breakdown + Operational Health */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Status Donut Chart */}
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
                  <RechartsLabel
                    position="center"
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      return (
                        <g>
                          <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-mono text-4xl font-bold tracking-tighter">
                            {totalInvoices}
                          </text>
                          <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                            Total
                          </text>
                        </g>
                      );
                    }}
                  />
                </Pie>
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-popover text-popover-foreground backdrop-blur-md border shadow-xl rounded-lg p-3">
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
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {statusData.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm text-muted-foreground truncate">{status.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operational Metrics Cards */}
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
      </div>
    </div>
  );
};

export default Insights;
