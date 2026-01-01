import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === `/dashboard${path}` || (path === '' && location.pathname === '/dashboard');

  const navLinks = {
    OWNER: [
      { path: '', label: 'All Invoices', icon: '📋' },
      { path: '/review', label: 'Review Queue', icon: '✏️' },
      { path: '/approve', label: 'Approve Queue', icon: '✅' },
      { path: '/upload', label: 'Upload Invoice', icon: '📤' },
      { path: '/reports', label: 'Reports', icon: '📊' },
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
      { path: '/reports', label: 'Reports', icon: '📊' }
    ]
  };

  const links = navLinks[user?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">📄 Smart Invoice</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="btn-secondary text-sm"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-screen shadow-lg border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {links.map((link) => (
              <Link key={link.path} to={`/dashboard${link.path}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
                    isActive(link.path)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </motion.div>
              </Link>
            ))}
          </nav>
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
