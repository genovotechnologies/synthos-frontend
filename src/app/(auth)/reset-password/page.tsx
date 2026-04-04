'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, Check } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', met: password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(password) },
    { label: 'Lowercase', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  const strength = checks.filter((c) => c.met).length;

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              strength >= level
                ? strength <= 1
                  ? 'bg-red-500'
                  : strength <= 2
                    ? 'bg-amber-500'
                    : strength <= 3
                      ? 'bg-violet-400'
                      : 'bg-emerald-500'
                : 'bg-zinc-800'
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5 text-[11px]">
            <Check size={10} className={check.met ? 'text-emerald-500' : 'text-zinc-700'} />
            <span className={check.met ? 'text-zinc-400' : 'text-zinc-600'}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        new_password: data.password,
      });
      setIsSuccess(true);
      setTimeout(() => router.push('/login?reset=true'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = cn(
    'w-full px-4 py-2.5 rounded-lg text-[15px]',
    'bg-zinc-900/50 border border-zinc-800/80',
    'text-white placeholder:text-zinc-600',
    'focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/15',
    'transition-all duration-150'
  );

  // No token provided
  if (!token) {
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
        <h2 className="text-xl font-semibold text-white mb-2">Invalid reset link</h2>
        <p className="text-zinc-500 text-[15px] mb-6 leading-relaxed">
          This password reset link is invalid or missing a token. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Request new reset link
        </Link>
      </motion.div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
          <CheckCircle className="text-emerald-400" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Password reset successful</h2>
        <p className="text-zinc-500 text-[15px] mb-6 leading-relaxed">
          Your password has been updated. Redirecting to sign in...
        </p>
        <Link
          href="/login?reset=true"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Go to sign in
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
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Set new password
        </h1>
        <p className="text-zinc-500 text-[15px] mt-2">
          Choose a strong password for your account
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
          <p className="text-sm leading-relaxed">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* New Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[13px] font-medium text-zinc-400">
            New password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className={cn(inputClasses, 'pr-11', errors.password && 'border-red-500/40')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-400">{errors.password.message}</p>
          )}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-zinc-400">
            Confirm new password
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat password"
              autoComplete="new-password"
              className={cn(
                inputClasses,
                'pr-11',
                errors.confirmPassword && 'border-red-500/40'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg font-medium text-[15px]',
            'bg-violet-600 text-white',
            'hover:bg-violet-500',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
            'flex items-center justify-center gap-2'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-6">
          <div>
            <div className="h-7 bg-zinc-800/50 rounded w-48 mb-3" />
            <div className="h-4 bg-zinc-800/30 rounded w-72" />
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="h-3 bg-zinc-800/30 rounded w-24" />
              <div className="h-10 bg-zinc-800/40 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-zinc-800/30 rounded w-32" />
              <div className="h-10 bg-zinc-800/40 rounded-lg" />
            </div>
            <div className="h-10 bg-zinc-800/50 rounded-lg" />
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
