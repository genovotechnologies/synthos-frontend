'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { Mail, AlertCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

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
      // TODO: Integrate with actual password reset API
      // await authApi.forgotPassword(data.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
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

        {isSuccess ? (
          // Success State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle className="text-green-400" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
            <p className="text-zinc-400 text-sm mb-6">
              We&apos;ve sent password reset instructions to your email address.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-white mb-2">Reset password</h1>
              <p className="text-zinc-400 text-sm">
                Enter your email and we&apos;ll send you instructions to reset your password.
              </p>
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
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs">{errors.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset instructions'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
