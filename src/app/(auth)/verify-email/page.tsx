'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import Cookies from 'js-cookie';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submitOtp = useCallback(async (code: string) => {
    if (code.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/verify-email', { email, otp: code });
      const data = response.data;

      // If backend returned a JWT, auto-login the user
      if (data.access_token) {
        Cookies.set('access_token', data.access_token, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
        // Route based on role
        const role = data.user?.role || 'user';
        const roleRoutes: Record<string, string> = {
          admin: '/admin',
          developer: '/developer',
          support: '/support',
        };
        router.push(roleRoutes[role] || '/dashboard');
        return;
      }

      // Fallback: redirect to login
      router.push('/login?verified=true');
    } catch (err: any) {
      const message = err?.message || 'Verification failed. Please try again.';
      setError(message);
      // Try to extract remaining attempts from error
      const match = message.match(/(\d+)\s*attempt/i);
      if (match) {
        setAttemptsRemaining(parseInt(match[1], 10));
      }
      // Clear OTP and refocus first input
      setOtp(Array(6).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsVerifying(false);
    }
  }, [email, isVerifying, router]);

  const handleChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;

      // Auto-focus next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all filled
      const code = next.join('');
      if (code.length === 6 && next.every((d) => d !== '')) {
        setTimeout(() => submitOtp(code), 100);
      }

      return next;
    });
  }, [submitOtp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
        setOtp((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        e.preventDefault();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split('');
    setOtp((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });

      // Focus appropriate input
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if all 6 pasted
      const code = next.join('');
      if (code.length === 6 && next.every((d) => d !== '')) {
        setTimeout(() => submitOtp(code), 100);
      }

      return next;
    });
  }, [submitOtp]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);

    try {
      await apiClient.post('/auth/resend-otp', { email });
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center py-4"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center">
          <AlertCircle className="text-red-400" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Missing email address</h2>
        <p className="text-zinc-500 text-[15px] mb-6 leading-relaxed">
          No email address was provided for verification.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Back to registration
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="w-14 h-14 mb-5 rounded-full bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
          <Mail className="text-violet-400" size={24} />
        </div>
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Verify your email
        </h1>
        <p className="text-zinc-500 text-[15px] mt-2 leading-relaxed">
          We sent a 6-digit code to{' '}
          <span className="text-zinc-300 font-medium">{email}</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 mb-6 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-sm leading-relaxed">
            <p>{error}</p>
            {attemptsRemaining !== null && (
              <p className="text-xs text-red-400/70 mt-1">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isVerifying}
            className={cn(
              'w-12 h-14 text-center text-2xl font-mono rounded-lg',
              'bg-zinc-900/50 border border-zinc-800/80',
              'text-white',
              'focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/15',
              'transition-all duration-150',
              'disabled:opacity-50',
              digit && 'border-violet-400/40 bg-violet-500/5'
            )}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {/* Verifying indicator */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-2 mb-6 text-zinc-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Verifying...
        </div>
      )}

      {/* Resend */}
      <div className="text-center space-y-4">
        <p className="text-[13px] text-zinc-600">
          Didn&apos;t receive a code?
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className={cn(
            'text-sm font-medium transition-colors',
            cooldown > 0 || isResending
              ? 'text-zinc-600 cursor-not-allowed'
              : 'text-violet-400 hover:text-violet-300'
          )}
        >
          {isResending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Sending...
            </span>
          ) : cooldown > 0 ? (
            `Resend code in ${cooldown}s`
          ) : (
            'Resend code'
          )}
        </button>
      </div>

      {/* Back to login */}
      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-6">
          <div>
            <div className="w-14 h-14 bg-zinc-800/50 rounded-full mb-5" />
            <div className="h-7 bg-zinc-800/50 rounded w-48 mb-3" />
            <div className="h-4 bg-zinc-800/30 rounded w-72" />
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-12 h-14 bg-zinc-800/40 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
