import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, Users, ShoppingBag, CreditCard, Flag, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminLayout() {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Reports', path: '/admin/reports', icon: Flag },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[var(--color-border-light)] hidden md:flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-light)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Admin Portal</h1>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">System Management</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-primary)]' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-[var(--color-border-light)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
            <h1 className="font-bold">Admin Portal</h1>
          </div>
          <Link to="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">← Back to Site</Link>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 animate-fadeIn">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border-light)] flex items-center justify-around px-2 py-2 z-40 safe-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-primary)]' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
