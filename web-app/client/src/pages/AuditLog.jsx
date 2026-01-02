import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auditAPI, userAPI, invoiceAPI } from '../services/api';

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchInvoice, setSearchInvoice] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, selectedUser, selectedAction, startDate, endDate, searchInvoice]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [auditRes, usersRes] = await Promise.all([
        auditAPI.getAllAudit({}),
        userAPI.getAll().catch(() => ({ data: { success: false, users: [] } }))
      ]);
      
      // Backend returns { success: true, logs: [...] }
      setAuditLogs(auditRes.data.logs || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    // Filter by user
    if (selectedUser) {
      filtered = filtered.filter(log => log.user_id === parseInt(selectedUser));
    }

    // Filter by action
    if (selectedAction) {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= end
      );
    }

    // Filter by invoice number
    if (searchInvoice) {
      filtered = filtered.filter(log => 
        log.details?.invoice_number?.toLowerCase().includes(searchInvoice.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedUser('');
    setSelectedAction('');
    setStartDate('');
    setEndDate('');
    setSearchInvoice('');
  };

  const actionTypes = [
    'INVOICE_UPLOADED',
    'INVOICE_UPDATED',
    'INVOICE_SUBMITTED',
    'INVOICE_APPROVED',
    'INVOICE_REJECTED',
    'PDF_GENERATED',
    'USER_CREATED',
    'USER_DEACTIVATED',
    'ROLE_CHANGED'
  ];

  const getActionBadgeColor = (action) => {
    const colors = {
      'INVOICE_UPLOADED': 'bg-blue-100 text-blue-800',
      'INVOICE_UPDATED': 'bg-yellow-100 text-yellow-800',
      'INVOICE_SUBMITTED': 'bg-purple-100 text-purple-800',
      'INVOICE_APPROVED': 'bg-green-100 text-green-800',
      'INVOICE_REJECTED': 'bg-red-100 text-red-800',
      'PDF_GENERATED': 'bg-indigo-100 text-indigo-800',
      'USER_CREATED': 'bg-teal-100 text-teal-800',
      'USER_DEACTIVATED': 'bg-gray-100 text-gray-800',
      'ROLE_CHANGED': 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
        <p className="text-gray-600 mt-2">
          Complete system audit trail of all user actions and invoice lifecycle events
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="select-field"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="select-field"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice #
            </label>
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="Search invoice..."
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {auditLogs.length} records
          </p>
          <button
            onClick={clearFilters}
            className="btn-secondary text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-12"
        >
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Audit Logs Found
          </h3>
          <p className="text-gray-600">
            {selectedUser || selectedAction || startDate || endDate || searchInvoice
              ? 'Try adjusting your filters'
              : 'No activity recorded yet'}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    User
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Invoice
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.user_name || `User ${log.user_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.invoice_id ? (
                        <a 
                          href={`/dashboard/invoices/${log.invoice_id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          #{log.invoice_id}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-indigo-600 hover:text-indigo-800">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                ← Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLog;
