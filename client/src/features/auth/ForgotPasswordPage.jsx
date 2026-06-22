import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, Sparkles } from 'lucide-react';
import { useForgotPasswordMutation } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      toast.success('Password reset link sent to your email');
      navigate('/login');
    } catch (err) {
      toast.error(err.data?.error || 'Failed to process request');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'linear-gradient(135deg, #1E272E 0%, #485460 100%)' }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-primary)] rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-md bg-white rounded-[24px] p-8 shadow-2xl relative z-10 animate-slideUp">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-[var(--color-primary)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Forgot Password?</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="you@example.com"
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
