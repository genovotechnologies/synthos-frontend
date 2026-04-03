'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setIsSuccess(true);
    } catch {
      // Always show success to prevent email enumeration
      setIsSuccess(true);
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
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <CheckCircle className="text-emerald-400" size={28} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
          <p className="text-zinc-500 text-[15px] mb-6 leading-relaxed">
            If an account exists with that email, we&apos;ve sent password reset instructions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-[26px] font-semibold text-white tracking-tight">
              Reset password
            </h1>
            <p className="text-zinc-500 text-[15px] mt-2">
              Enter your email and we&apos;ll send you reset instructions.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3.5 mb-6 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[13px] font-medium text-zinc-400">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@company.com"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-[15px]",
                  "bg-zinc-900/50 border border-zinc-800/80",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/15",
                  "transition-all duration-150",
                  errors.email && "border-red-500/40"
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

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
                  Sending...
                </>
              ) : (
                'Send reset instructions'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
