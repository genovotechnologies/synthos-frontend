'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { isValidRedirectUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

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
      await login(data);
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      {/* Glass Card */}
      <div className="backdrop-blur-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8">
          <SynthosLogo size={36} />
          <span className="text-xl font-semibold text-white">Synthos</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
          <p className="text-zinc-400 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-lg",
                  "bg-zinc-950 border border-zinc-800",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
                  "transition-colors duration-200",
                  errors.email && "border-red-500/50 focus:border-red-500"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  "w-full pl-10 pr-12 py-3 rounded-lg",
                  "bg-zinc-950 border border-zinc-800",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
                  "transition-colors duration-200",
                  errors.password && "border-red-500/50 focus:border-red-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium text-sm",
              "bg-gradient-to-r from-violet-600 to-violet-500",
              "text-white",
              "hover:from-violet-500 hover:to-violet-400",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "flex items-center justify-center gap-2"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-zinc-900/50 text-zinc-500">or</span>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="backdrop-blur-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 animate-pulse">
          <div className="h-10 bg-zinc-800 rounded w-32 mb-8" />
          <div className="h-6 bg-zinc-800 rounded w-48 mb-2" />
          <div className="h-4 bg-zinc-800 rounded w-64 mb-8" />
          <div className="space-y-4">
            <div className="h-12 bg-zinc-800 rounded-lg" />
            <div className="h-12 bg-zinc-800 rounded-lg" />
            <div className="h-12 bg-zinc-800 rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
