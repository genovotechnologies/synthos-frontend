'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, ArrowRight, Loader2, Check } from 'lucide-react';

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  company: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  const strength = checks.filter(c => c.met).length;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              strength >= level
                ? strength <= 1 ? "bg-red-500"
                : strength <= 2 ? "bg-yellow-500"
                : strength <= 3 ? "bg-blue-500"
                : "bg-green-500"
                : "bg-zinc-800"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5 text-xs">
            <Check size={12} className={check.met ? "text-green-500" : "text-zinc-600"} />
            <span className={check.met ? "text-zinc-400" : "text-zinc-600"}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        company: data.company,
      });
      router.push('/login?registered=true');
    } catch {
      setError('Registration failed. Please try again.');
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
          <h1 className="text-2xl font-semibold text-white mb-2">Create an account</h1>
          <p className="text-zinc-400 text-sm">Start validating your AI training data</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-zinc-300">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                {...register('name')}
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-lg",
                  "bg-zinc-950 border border-zinc-800",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
                  "transition-colors duration-200",
                  errors.name && "border-red-500/50 focus:border-red-500"
                )}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

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

          {/* Company Field */}
          <div className="space-y-2">
            <label htmlFor="company" className="text-sm font-medium text-zinc-300">
              Company <span className="text-zinc-600">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                {...register('company')}
                id="company"
                type="text"
                placeholder="Acme Inc."
                autoComplete="organization"
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-lg",
                  "bg-zinc-950 border border-zinc-800",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
                  "transition-colors duration-200"
                )}
              />
            </div>
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
                autoComplete="new-password"
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
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-300">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(
                  "w-full pl-10 pr-12 py-3 rounded-lg",
                  "bg-zinc-950 border border-zinc-800",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
                  "transition-colors duration-200",
                  errors.confirmPassword && "border-red-500/50 focus:border-red-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium text-sm mt-2",
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
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Terms */}
          <p className="text-xs text-zinc-500 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-violet-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>
          </p>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
