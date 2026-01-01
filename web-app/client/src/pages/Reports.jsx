import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reportAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [metrics, setMetrics] = useState(null);
  const [revenueFlow, setRevenueFlow] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [metricsRes, revenueRes, customersRes] = await Promise.all([
        reportAPI.getDashboard(),
        reportAPI.getRevenueFlow({ days: 30 }),
        reportAPI.getTopCustomers({ limit: 5 })
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.metrics);
      if (revenueRes.data.success) setRevenueFlow(revenueRes.data.data);
      if (customersRes.data.success) setTopCustomers(customersRes.data.customers);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Business Pulse Dashboard</h1>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
        >
          <p className="text-sm opacity-90 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">
            ₹{metrics?.total_revenue ? parseFloat(metrics.total_revenue).toLocaleString('en-IN') : '0'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-green-500 to-teal-600 text-white"
        >
          <p className="text-sm opacity-90 mb-2">Invoices</p>
          <p className="text-3xl font-bold">{metrics?.invoice_count || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-amber-500 to-orange-600 text-white"
        >
          <p className="text-sm opacity-90 mb-2">Avg Value</p>
          <p className="text-3xl font-bold">
            ₹{metrics?.avg_value ? parseFloat(metrics.avg_value).toLocaleString('en-IN') : '0'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-gradient-to-br from-pink-500 to-rose-600 text-white"
        >
          <p className="text-sm opacity-90 mb-2">Avg Approval</p>
          <p className="text-3xl font-bold">
            {metrics?.avg_approval_days ? parseFloat(metrics.avg_approval_days).toFixed(1) : '0'} days
          </p>
        </motion.div>
      </div>

      {/* Revenue Flow Chart */}
      {revenueFlow.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Flow (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="daily_revenue" 
                stroke="#4f46e5" 
                strokeWidth={2}
                name="Revenue (₹)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Customers</h2>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-4">
                <div className="text-2xl font-bold text-gray-400 w-8">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">
                    ₹{parseFloat(customer.total_spent).toLocaleString('en-IN')} • {customer.invoice_count} invoices
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${customer.revenue_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;
