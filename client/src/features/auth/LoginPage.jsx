import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useLoginMutation } from '../../services/api';
import { setCredentials, setOtpState } from './authSlice';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', phone: '', password: '', loginMethod: 'email' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (form.loginMethod === 'email' && !form.email) errs.email = 'Email is required';
    if (form.loginMethod === 'phone') {
      if (!form.phone) errs.phone = 'Phone is required';
      else if (!/^(97|98)\d{8}$/.test(form.phone)) errs.phone = 'Must be 10 digits starting with 97/98';
    }
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const body = { password: form.password };
      if (form.loginMethod === 'email') body.email = form.email;
      else body.phone = form.phone;

      const result = await login(body).unwrap();

      if (result.needsVerification) {
        dispatch(setOtpState({ userId: result.userId, contactType: form.loginMethod }));
        toast.error('Please verify your account first');
        navigate('/verify-otp');
        return;
      }

      dispatch(setCredentials(result));
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate(result.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' }}>
      <div className="w-full max-w-md animate-slideUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #E84118, #ff6348)' }}>
              T
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-4 text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Sign in to your Thrief account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Login Method Toggle */}
          <div className="flex bg-[var(--color-bg)] rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, loginMethod: 'email' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.loginMethod === 'email' ? 'bg-white shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, loginMethod: 'phone' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.loginMethod === 'phone' ? 'bg-white shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.loginMethod === 'email' ? (
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  />
                </div>
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">+977</span>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className={`input pl-14 ${errors.phone ? 'input-error' : ''}`}
                  />
                </div>
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
            )}

            <div className="input-group">
              <div className="flex items-center justify-between">
                <label className="input-label">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--color-primary)] font-semibold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
