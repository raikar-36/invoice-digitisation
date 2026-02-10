import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI } from '../services/api';
import { showToast } from '../utils/toast.jsx';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertTriangle, UserCheck } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToModify, setUserToModify] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
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

  // Validate individual field on blur
  const validateField = (fieldName, value) => {
    let error = null;
    
    if (fieldName === 'name') {
      if (!value || value.trim().length < 2) {
        error = 'Name must be at least 2 characters';
      }
    } else if (fieldName === 'email') {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Invalid email format';
      }
    } else if (fieldName === 'password') {
      if (!value || value.length < 8) {
        error = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(value)) {
        error = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(value)) {
        error = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(value)) {
        error = 'Password must contain at least one number';
      }
    }
    
    setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    
    // Client-side validation
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      setCreating(true);
      await userAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'STAFF' });
      setValidationErrors({});
      setShowPassword(false);
      loadUsers();
      showToast.success('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || 'Failed to create user');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = (user) => {
    setUserToModify(user);
    setShowDeactivateDialog(true);
  };

  const confirmDeactivate = async () => {
    if (!userToModify) return;
    
    try {
      setDeactivating(true);
      await userAPI.deactivate(userToModify.id);
      loadUsers();
      showToast.success('User deactivated successfully');
      setShowDeactivateDialog(false);
      setUserToModify(null);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      showToast.error(error.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = (user) => {
    setUserToModify(user);
    setShowReactivateDialog(true);
  };

  const confirmReactivate = async () => {
    if (!userToModify) return;
    
    try {
      setReactivating(true);
      await userAPI.reactivate(userToModify.id);
      loadUsers();
      showToast.success('User reactivated successfully');
      setShowReactivateDialog(false);
      setUserToModify(null);
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      showToast.error(error.response?.data?.message || 'Failed to reactivate user');
    } finally {
      setReactivating(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowPasswordModal(true);
  };

  const handleDeleteConfirm = async (password) => {
    try {
      // Verify password first via authAPI (imported in api.js)
      await userAPI.delete(userToDelete.id, { password });
      loadUsers();
      showToast.success('User deleted successfully');
    } catch (error) {
      throw error; // Let modal handle the error
    }
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
                  <TableCell className="text-xs font-mono text-muted-foreground">
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
                              onClick={() => handleDeactivate(user)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(user)}
                              className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/40"
                            >
                              Reactivate
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
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
            <DialogDescription>
              Add a new user to the system with their details and assigned role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} noValidate className="space-y-4">
            <div>
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setValidationErrors({ ...validationErrors, name: null });
                }}
                onBlur={(e) => validateField('name', e.target.value)}
                className={validationErrors.name ? 'border-destructive' : ''}
                minLength={2}
                maxLength={100}
                required
                placeholder="John Doe"
              />
              {validationErrors.name && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value.toLowerCase() });
                  setValidationErrors({ ...validationErrors, email: null });
                }}
                onBlur={(e) => validateField('email', e.target.value)}
                className={validationErrors.email ? 'border-destructive' : ''}
                maxLength={100}
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                required
                placeholder="user@example.com"
              />
              {validationErrors.email && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.email}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setValidationErrors({ ...validationErrors, password: null });
                  }}
                  onBlur={(e) => validateField('password', e.target.value)}
                  className={`pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                  minLength={8}
                  maxLength={128}
                  required
                  placeholder="Min 8 characters, 1 uppercase, 1 number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.password}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
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
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Modal for Deletion */}
      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirm User Deletion"
        message={`Enter your password to delete user "${userToDelete?.name}". This action cannot be undone.`}
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-amber-500/10 p-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold tracking-tight">
                Deactivate User
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{userToModify?.name}</strong>? 
              This user will no longer be able to access the system until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate}
              disabled={deactivating}
              className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20"
            >
              {deactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold tracking-tight">
                Reactivate User
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to reactivate <strong>{userToModify?.name}</strong>? 
              This user will regain access to the system with their previous permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReactivate}
              disabled={reactivating}
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40"
            >
              {reactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reactivating...
                </>
              ) : (
                'Reactivate User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
