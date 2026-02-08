import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FileText, 
  ClipboardCheck, 
  CheckCircle2, 
  Upload, 
  BarChart3, 
  Users, 
  FileSearch, 
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === `/dashboard${path}` || (path === '' && location.pathname === '/dashboard');

  // Icon mapping
  const iconMap = {
    '📋': FileText,
    '✏️': ClipboardCheck,
    '✅': CheckCircle2,
    '📤': Upload,
    '📊': BarChart3,
    '👥': Users,
    '📜': FileSearch,
  };

  const navLinks = {
    OWNER: [
      { path: '', label: 'All Invoices', icon: '📋' },
      { path: '/review', label: 'Review Queue', icon: '✏️' },
      { path: '/approve', label: 'Approve Queue', icon: '✅' },
      { path: '/upload', label: 'Upload Invoice', icon: '📤' },
      { path: '/insights', label: 'Insights', icon: '📊' },
      { path: '/users', label: 'Users', icon: '👥' },
      { path: '/audit', label: 'Audit Log', icon: '📜' }
    ],
    STAFF: [
      { path: '', label: 'My Invoices', icon: '📋' },
      { path: '/review', label: 'Review Queue', icon: '✏️' },
      { path: '/upload', label: 'Upload Invoice', icon: '📤' }
    ],
    ACCOUNTANT: [
      { path: '', label: 'Approved Invoices', icon: '📋' },
      { path: '/insights', label: 'Insights', icon: '📊' }
    ]
  };

  const links = navLinks[user?.role] || [];
  
  // Get user initials
  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'STAFF':
        return 'secondary';
      case 'ACCOUNTANT':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation with Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2 mr-8">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Smart Invoice</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Separator orientation="vertical" className="h-8" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getUserInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.role}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r bg-muted/40">
          <nav className="flex flex-col gap-2 p-4">
            {links.map((link) => {
              const Icon = iconMap[link.icon];
              const active = isActive(link.path);
              
              return (
                <Link key={link.path} to={`/dashboard${link.path}`}>
                  <Button
                    variant={active ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-3 ${
                      active ? '' : 'hover:bg-accent'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="font-medium">{link.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          {/* Role Badge in Sidebar */}
          <div className="px-4 pb-4 mt-auto">
            <Separator className="mb-4" />
            <Badge variant={getRoleBadgeVariant(user?.role)} className="w-full justify-center py-1">
              {user?.role} ACCESS
            </Badge>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
