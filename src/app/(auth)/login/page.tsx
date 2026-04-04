'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { isValidRedirectUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Gift, CheckCircle } from 'lucide-react';
import { creditsApi } from '@/lib/api/credits';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const role = await login(data);

      // Auto-redeem promo code if present
      const promoCode = searchParams.get('promo');
      if (promoCode) {
        try {
          await creditsApi.redeemPromo(promoCode);
        } catch { }
      }

      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
        router.push(redirectUrl);
      } else {
        // Auto-route based on role
        const roleRoutes: Record<string, string> = {
          admin: '/admin',
          developer: '/developer',
          support: '/support',
          user: promoCode ? '/dashboard/billing' : '/dashboard',
        };
        router.push(roleRoutes[role] || '/dashboard');
      }
    } catch (err: any) {
      if (err?.message === 'EMAIL_VERIFICATION_REQUIRED') {
        router.push(`/verify-email?email=${encodeURIComponent(err.email || data.email)}`);
        return;
      }
      const message = err?.message || '';
      if (message.toLowerCase().includes('locked')) {
        setError('Your account has been temporarily locked due to too many failed attempts. Please try again later.');
      } else if (message.toLowerCase().includes('inactive') || message.toLowerCase().includes('suspended')) {
        setError('Your account has been suspended. Please contact support for assistance.');
      } else {
        setError('Incorrect email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-zinc-500 text-[15px] mt-2">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Email Verified Success */}
      {searchParams.get('verified') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 mb-6 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-emerald-400"
        >
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm leading-relaxed">Email verified successfully. Please sign in.</p>
        </motion.div>
      )}

      {/* Password Reset Success */}
      {searchParams.get('reset') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 mb-6 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-emerald-400"
        >
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm leading-relaxed">Password reset successfully. Please sign in with your new password.</p>
        </motion.div>
      )}

      {/* Registration + Promo Success */}
      {searchParams.get('registered') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 mb-6 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-emerald-400"
        >
          {searchParams.get('promo') ? (
            <>
              <Gift size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">Account created! Sign in to activate your free credits.</p>
            </>
          ) : (
            <>
              <ArrowRight size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">Account created successfully. Please sign in.</p>
            </>
          )}
        </motion.div>
      )}

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
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-[13px] font-medium text-zinc-400">
            Email address
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg text-[15px]",
              "bg-zinc-900/50 border border-zinc-800/80",
              "text-white placeholder:text-zinc-600",
              "focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/15",
              "transition-all duration-150",
              errors.email && "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15"
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-[13px] font-medium text-zinc-400">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] text-zinc-500 hover:text-violet-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={cn(
                "w-full px-4 py-2.5 pr-11 rounded-lg text-[15px]",
                "bg-zinc-900/50 border border-zinc-800/80",
                "text-white placeholder:text-zinc-600",
                "focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/15",
                "transition-all duration-150",
                errors.password && "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15"
              )}
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
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg font-medium text-[15px]",
            "bg-violet-600 text-white",
            "hover:bg-violet-500",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-150",
            "flex items-center justify-center gap-2"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-[14px] text-zinc-500 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6">
        <div>
          <div className="h-7 bg-zinc-800/50 rounded w-40 mb-3" />
          <div className="h-4 bg-zinc-800/30 rounded w-64" />
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-3 bg-zinc-800/30 rounded w-20" />
            <div className="h-10 bg-zinc-800/40 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-zinc-800/30 rounded w-16" />
            <div className="h-10 bg-zinc-800/40 rounded-lg" />
          </div>
          <div className="h-10 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
