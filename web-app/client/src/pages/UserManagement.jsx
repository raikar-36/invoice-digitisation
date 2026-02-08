import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI } from '../services/api';
import { showToast, confirmAction } from '../utils/toast.jsx';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'STAFF' });
      loadUsers();
      showToast.success('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      showToast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeactivate = async (userId) => {
    confirmAction('Are you sure you want to deactivate this user?', async () => {
      try {
        await userAPI.deactivate(userId);
        loadUsers();
        showToast.success('User deactivated successfully');
      } catch (error) {
        console.error('Failed to deactivate user:', error);
        showToast.error(error.response?.data?.message || 'Failed to deactivate user');
      }
    });
  };

  const handleReactivate = async (userId) => {
    confirmAction('Are you sure you want to reactivate this user?', async () => {
      try {
        await userAPI.reactivate(userId);
        loadUsers();
        showToast.success('User reactivated successfully');
      } catch (error) {
        console.error('Failed to reactivate user:', error);
        showToast.error(error.response?.data?.message || 'Failed to reactivate user');
      }
    });
  };

  const handleDelete = async (userId) => {
    confirmAction('Are you sure you want to delete this user? This action cannot be undone.', async () => {
      try {
        await userAPI.delete(userId);
        loadUsers();
        showToast.success('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user:', error);
        showToast.error(error.response?.data?.message || 'Failed to delete user');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">User Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create User
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.id === currentUser?.id ? (
                        <span className="text-xs text-muted-foreground italic px-3 py-1">You cannot modify your own account</span>
                      ) : (
                        <>
                          {user.status === 'ACTIVE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(user.id)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(user.id)}
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              Reactivate
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
