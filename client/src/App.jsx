import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import Footer from './components/layout/Footer';

// Lazy-loaded pages
const HomePage = lazy(() => import('./features/home/HomePage'));
const NotFoundPage = lazy(() => import('./features/home/NotFoundPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./features/auth/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const CategoryPage = lazy(() => import('./features/products/CategoryPage'));
const ProductDetailPage = lazy(() => import('./features/products/ProductDetailPage'));
const CategoriesPage = lazy(() => import('./features/products/CategoriesPage'));
const SearchPage = lazy(() => import('./features/products/SearchPage'));
const WishlistPage = lazy(() => import('./features/wishlist/WishlistPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const ChatPage = lazy(() => import('./features/chat/ChatPage'));
const SellerDashboard = lazy(() => import('./features/seller/SellerDashboard'));
const PostProductPage = lazy(() => import('./features/seller/PostProductPage'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminUserManagement = lazy(() => import('./features/admin/AdminUserManagement'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const AdminProductManagement = lazy(() => import('./features/admin/AdminProductManagement'));
const AdminPaymentManagement = lazy(() => import('./features/admin/AdminPaymentManagement'));
const AdminReportManagement = lazy(() => import('./features/admin/AdminReportManagement'));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner-dark w-8 h-8 mx-auto mb-3" style={{ width: 32, height: 32 }} />
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      </div>
    </div>
  );
}

// Auth guard — redirects to login if not authenticated
function ProtectedRoute() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Guest route — redirects to home if already logged in
function GuestRoute() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return <Outlet />;
}

// Main layout with navbar + footer
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

// Auth layout without navbar/footer
function AuthLayout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1E272E',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* Auth routes (no navbar) */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        {/* Public Main Layout routes (browsing) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/user/:userId" element={<ProfilePage />} />

          {/* Protected Main Layout routes (user actions) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:chatId" element={<ChatPage />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/post" element={<PostProductPage />} />
          </Route>

          {/* 404 Not Found Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Layout (Sidebar without main navbar/footer) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminLayout />
            </Suspense>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="products" element={<AdminProductManagement />} />
            <Route path="payments" element={<AdminPaymentManagement />} />
            <Route path="reports" element={<AdminReportManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
