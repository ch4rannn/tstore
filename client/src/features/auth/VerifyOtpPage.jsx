import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../services/api';
import { setCredentials } from './authSlice';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const { otpUserId, otpContactType } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes
  const inputRefs = useRef([]);
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  useEffect(() => {
    if (!otpUserId) {
      navigate('/register');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [otpUserId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const newOtp = paste.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleSubmit(paste);
    }
  };

  const handleSubmit = async (code) => {
    if (!code || code.length !== 6) return;
    try {
      const result = await verifyOtp({ userId: otpUserId, code }).unwrap();
      dispatch(setCredentials(result));
      toast.success('Account verified! Welcome to Thrief!');
      navigate('/');
    } catch (err) {
      toast.error(err.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ userId: otpUserId }).unwrap();
      setTimer(300);
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error(err.data?.error || 'Failed to resend');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' }}>
      <div className="w-full max-w-md animate-slideUp">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(232,65,24,0.1), rgba(232,65,24,0.05))' }}>
            📱
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>Verify Your Account</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Enter the 6-digit code sent to your {otpContactType || 'email/phone'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* OTP Inputs */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 ${
                  digit ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)]'
                }`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {timer > 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Code expires in <span className="font-semibold text-[var(--color-accent)]">{formatTime(timer)}</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--color-danger)]">OTP expired</p>
            )}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verifying...</span>
            </div>
          )}

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending || timer > 240}
                className="text-[var(--color-primary)] font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          <Link to="/register" className="text-[var(--color-primary)] hover:underline">← Back to registration</Link>
        </p>
      </div>
    </div>
  );
}
