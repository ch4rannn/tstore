import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, ShoppingBag, Store } from 'lucide-react';
import { useRegisterMutation } from '../../services/api';
import { setOtpState } from './authSlice';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'buyer', contactMethod: 'email' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (form.contactMethod === 'email') {
      if (!form.email) errs.email = 'Email is required';
      else if (!/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) errs.email = 'Invalid email format';
    }
    if (form.contactMethod === 'phone') {
      if (!form.phone) errs.phone = 'Phone is required';
      else if (!/^(97|98)\d{8}$/.test(form.phone)) errs.phone = 'Must be 10 digits starting with 97/98';
    }
    if (!form.password || form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const body = { name: form.name.trim(), password: form.password, role: form.role };
      if (form.contactMethod === 'email') body.email = form.email;
      else body.phone = form.phone;

      const result = await register(body).unwrap();
      dispatch(setOtpState({ userId: result.userId, contactType: result.contactType }));
      toast.success('Account created! Check your OTP.');
      navigate('/verify-otp');
    } catch (err) {
      toast.error(err.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' }}>
      <div className="w-full max-w-md animate-slideUp">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #E84118, #ff6348)' }}>
              T
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-4 text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>Create your account</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Join Thrief and start buying or selling</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'buyer' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.role === 'buyer'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="text-sm font-semibold">I'm a Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'seller' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.role === 'seller'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              <Store className="w-6 h-6" />
              <span className="text-sm font-semibold">I'm a Seller</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input type="text" placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`input pl-10 ${errors.name ? 'input-error' : ''}`} />
              </div>
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            {/* Contact Method Toggle */}
            <div className="flex bg-[var(--color-bg)] rounded-xl p-1 mb-1">
              <button type="button" onClick={() => setForm({ ...form, contactMethod: 'email' })} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.contactMethod === 'email' ? 'bg-white shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                Email
              </button>
              <button type="button" onClick={() => setForm({ ...form, contactMethod: 'phone' })} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.contactMethod === 'phone' ? 'bg-white shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                Phone
              </button>
            </div>

            {form.contactMethod === 'email' ? (
              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`input pl-10 ${errors.email ? 'input-error' : ''}`} />
                </div>
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">+977</span>
                  <input type="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={`input pl-14 ${errors.phone ? 'input-error' : ''}`} />
                </div>
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
