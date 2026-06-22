import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, Sparkles } from 'lucide-react';
import { useResetPasswordMutation } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
          <p className="text-[var(--color-text-muted)] mb-4">This password reset link is invalid or has expired.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">Go to Login</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'linear-gradient(135deg, #1E272E 0%, #485460 100%)' }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-primary)] rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-md bg-white rounded-[24px] p-8 shadow-2xl relative z-10 animate-slideUp">
        <div className="mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-[var(--color-primary)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Set New Password</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-4 text-base">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
