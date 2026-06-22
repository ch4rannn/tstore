import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ShoppingBag, MessageCircle, User, Menu, X, Heart, LogOut, Settings, ChevronDown, Package } from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { useSearchProductsQuery, useLogoutMutation } from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [logoutApi] = useLogoutMutation();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: searchResults } = useSearchProductsQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    try { await logoutApi().unwrap(); } catch {}
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #E84118, #ff6348)' }}>
            T
          </div>
          <span className="text-xl font-bold hidden sm:block" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}>
            Thri<span className="text-gradient">ef</span>
          </span>
        </Link>

        {/* Search Bar — Desktop */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 pr-4 py-2.5 bg-[var(--color-bg)] border-transparent focus:bg-white"
            />
          </div>
          {/* Search Dropdown */}
          {debouncedQuery.length >= 2 && searchResults?.products?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-[var(--color-border-light)] overflow-hidden animate-slideDown z-50">
              {searchResults.products.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg)] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-bg)] shrink-0 overflow-hidden">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-[var(--color-primary)] font-semibold">Rs {p.price?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              <Link
                to={`/search?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                className="block px-4 py-2.5 text-sm text-center text-[var(--color-primary)] font-medium bg-[var(--color-bg)] hover:bg-[var(--color-bg-dark)]"
              >
                See all results →
              </Link>
            </div>
          )}
        </form>

        {/* Mobile Search Toggle */}
        <button onClick={() => setShowSearch(!showSearch)} className="md:hidden btn-ghost btn-icon">
          <Search className="w-5 h-5" />
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <Link to="/wishlist" className="btn-ghost btn-icon relative hidden sm:flex" title="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>
              <Link to="/chat" className="btn-ghost btn-icon relative" title="Messages">
                <MessageCircle className="w-5 h-5" />
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-black/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform hidden sm:block ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--color-border-light)] py-2 animate-scaleIn origin-top-right z-50">
                    <div className="px-4 py-2 border-b border-[var(--color-border-light)]">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] capitalize">{user?.role}</p>
                    </div>
                    <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)] transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    {(user?.role === 'seller' || user?.role === 'admin') && (
                      <Link to="/seller/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)] transition-colors">
                        <Package className="w-4 h-4" /> Seller Dashboard
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors font-medium">
                        <Settings className="w-4 h-4" /> Admin Portal
                      </Link>
                    )}
                    <Link to="/wishlist" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)] transition-colors">
                      <Heart className="w-4 h-4" /> Wishlist
                    </Link>
                    <div className="border-t border-[var(--color-border-light)] mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-red-50 w-full transition-colors">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 animate-slideDown">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="input pl-10 bg-white"
            />
          </div>
        </form>
      )}
    </header>
  );
}
