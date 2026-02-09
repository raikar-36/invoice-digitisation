import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { auditAPI, userAPI, invoiceAPI } from '../services/api';
import { FileSearch, Loader2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';

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
    if (selectedUser && selectedUser !== '') {
      const userId = parseInt(selectedUser);
      filtered = filtered.filter(log => log.user_id === userId);
    }

    // Filter by action
    if (selectedAction && selectedAction !== '') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Filter by date range
    if (startDate && startDate !== '') {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= start
      );
    }
    if (endDate && endDate !== '') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= end
      );
    }

    // Filter by invoice number
    if (searchInvoice && searchInvoice.trim() !== '') {
      const search = searchInvoice.toLowerCase().trim();
      filtered = filtered.filter(log => 
        log.invoice_number?.toLowerCase().includes(search)
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
    const variants = {
      'INVOICE_UPLOADED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'INVOICE_UPDATED': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      'INVOICE_SUBMITTED': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
      'INVOICE_APPROVED': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      'INVOICE_REJECTED': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      'PDF_GENERATED': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
      'USER_CREATED': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
      'USER_DEACTIVATED': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
      'ROLE_CHANGED': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
    };
    return variants[action] || 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
          Audit Log
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete system audit trail of all user actions and invoice lifecycle events
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUser || "ALL"} onValueChange={(value) => setSelectedUser(value === "ALL" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  <SelectItem value="ALL">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={selectedAction || "ALL"} onValueChange={(value) => setSelectedAction(value === "ALL" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Select start date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <DatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="Select end date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchInvoice">Invoice #</Label>
              <Input
                id="searchInvoice"
                type="text"
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                placeholder="Search invoice..."
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {auditLogs.length} records
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSearch className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">
              No Audit Logs Found
            </CardTitle>
            <CardDescription>
              {selectedUser || selectedAction || startDate || endDate || searchInvoice
                ? 'Try adjusting your filters'
                : 'No activity recorded yet'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase text-xs font-bold">
                        Timestamp
                      </TableHead>
                      <TableHead className="uppercase text-xs font-bold">
                        User
                      </TableHead>
                      <TableHead className="uppercase text-xs font-bold">
                        Action
                      </TableHead>
                      <TableHead className="uppercase text-xs font-bold">
                        Invoice
                      </TableHead>
                      <TableHead className="uppercase text-xs font-bold">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-sm font-mono">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user_name || `User ${log.user_id}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.invoice_id ? (
                            <a 
                              href={`/dashboard/invoices/${log.invoice_id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {log.invoice_number || `#${log.invoice_id}`}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-primary hover:underline">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto font-mono">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLog;
