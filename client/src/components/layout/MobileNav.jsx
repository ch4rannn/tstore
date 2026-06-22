import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Grid3X3, PlusCircle, MessageCircle, User } from 'lucide-react';

export default function MobileNav() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  if (!isAuthenticated) return null;

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/categories', icon: Grid3X3, label: 'Categories' },
    { to: user?.role === 'seller' ? '/seller/post' : '/categories', icon: PlusCircle, label: 'Sell', highlight: user?.role === 'seller' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20 md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label, highlight }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`
            }
          >
            {highlight ? (
              <div className="w-10 h-10 -mt-4 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/30">
                <Icon className="w-5 h-5" />
              </div>
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
