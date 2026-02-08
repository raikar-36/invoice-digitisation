import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAnalytics('all', '', '', new Date().getFullYear());
  }, []);

  const loadAnalytics = async (range = dateRange, start = '', end = '', year = selectedYear) => {
    try {
      setLoading(true);
      const params = { year };
      
      if (start && end) {
        params.startDate = start;
        params.endDate = end;
      } else if (range !== 'custom' && range !== 'all') {
        const today = new Date();
        const daysAgo = parseInt(range);
        const startDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }

      console.log('Loading analytics with params:', params);
      const response = await axios.get('/api/reports/analytics', { 
        params,
        withCredentials: true 
      });
      
      console.log('Analytics response:', response.data);
      if (response.data.success) {
        // Convert string values to numbers for pie charts
        const processedData = {
          ...response.data.data,
          topCustomersByCount: response.data.data.topCustomersByCount?.map(item => ({
            ...item,
            value: parseInt(item.value)
          })) || [],
          topCustomersByRevenue: response.data.data.topCustomersByRevenue?.map(item => ({
            ...item,
            value: parseFloat(item.value)
          })) || []
        };
        setData(processedData);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
      loadAnalytics(value, '', '', selectedYear);
    }
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      loadAnalytics('custom', customStart, customEnd, selectedYear);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
    loadAnalytics(dateRange, customStart, customEnd, parseInt(year));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Add a cache-busting parameter to force fresh data
      const params = { year: selectedYear, _t: Date.now() };
      
      if (customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      } else if (dateRange !== 'custom' && dateRange !== 'all') {
        const today = new Date();
        const daysAgo = parseInt(dateRange);
        const startDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }

      const response = await axios.get('/api/reports/analytics', { 
        params,
        withCredentials: true 
      });
      
      if (response.data.success) {
        const processedData = {
          ...response.data.data,
          topCustomersByCount: response.data.data.topCustomersByCount?.map(item => ({
            ...item,
            value: parseInt(item.value)
          })) || [],
          topCustomersByRevenue: response.data.data.topCustomersByRevenue?.map(item => ({
            ...item,
            value: parseFloat(item.value)
          })) || []
        };
        setData(processedData);
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">No analytics data available</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">There might be no approved invoices yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive business insights and metrics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary flex items-center gap-2"
        >
          <svg 
            className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h2>
        
        {/* Date Range Filter - For KPIs, Pie Charts, and Operational Metrics */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Date Range (KPIs, Top Customers, Operational Metrics)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Range</label>
              <select 
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="select-field"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input 
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input 
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="input-field"
                  />
                </div>
              </>
            )}
          </div>
          
          {dateRange === 'custom' && (
            <div className="mt-3">
              <button onClick={handleCustomDateApply} className="btn-primary">
                Apply Custom Date Range
              </button>
            </div>
          )}
        </div>

        {/* Year Filter - For Bar Charts */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Year (Yearly Invoice Count & Revenue)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Year</label>
              <select 
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="select-field"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        >
          <p className="text-sm opacity-90 mb-1">Total Invoices</p>
          <p className="text-3xl font-bold">{data?.kpis?.total_invoices || 0}</p>
          <p className="text-xs opacity-75 mt-2">📊 Invoice Count</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-green-500 to-green-600 text-white"
        >
          <p className="text-sm opacity-90 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">
            ₹{parseFloat(data?.kpis?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-2">💰 Revenue Generated</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white"
        >
          <p className="text-sm opacity-90 mb-1">Total Items Sold</p>
          <p className="text-3xl font-bold">{parseFloat(data?.kpis?.total_items_sold || 0).toFixed(0)}</p>
          <p className="text-xs opacity-75 mt-2">📦 Items Delivered</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white"
        >
          <p className="text-sm opacity-90 mb-1">Unique Customers</p>
          <p className="text-3xl font-bold">{data?.kpis?.unique_customers || 0}</p>
          <p className="text-xs opacity-75 mt-2">👥 Customer Base</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Yearly Invoice Count Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Yearly Invoice Count ({selectedYear})
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.yearlyInvoiceCount || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#4F46E5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Yearly Revenue Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Yearly Revenue ({selectedYear})
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.yearlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top 10 Customers by Invoice Count - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 10 Customers (Invoice Count)</h2>
          {data?.topCustomersByCount && data.topCustomersByCount.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topCustomersByCount}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {data.topCustomersByCount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No customer data available for selected date range
            </div>
          )}
        </motion.div>

        {/* Top 10 Customers by Revenue - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 10 Customers (Revenue)</h2>
          {data?.topCustomersByRevenue && data.topCustomersByRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topCustomersByRevenue}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ₹${parseFloat(entry.value).toFixed(0)}`}
                >
                  {data.topCustomersByRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value) => `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No customer data available for selected date range
            </div>
          )}
        </motion.div>
      </div>

      {/* Daily Trend - Current Month Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="card mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Daily Invoice Trend (Current Month)
        </h2>
        {data?.dailyTrend && data.dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            No invoice data for current month (January 2026)
          </div>
        )}
      </motion.div>

      {/* Operational Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="card"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Operational Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Avg Items Per Invoice</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {parseFloat(data?.operationalMetrics?.avgItemsPerInvoice || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Busiest Day</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {data?.operationalMetrics?.busiestDay || 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Most Active Customer</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {data?.operationalMetrics?.mostActiveCustomer || 'N/A'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
