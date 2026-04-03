'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Check, Tag, ChevronDown } from 'lucide-react';

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  company: z.string().optional(),
  promoCode: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', met: password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(password) },
    { label: 'Lowercase', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  const strength = checks.filter(c => c.met).length;

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              strength >= level
                ? strength <= 1 ? "bg-red-500"
                : strength <= 2 ? "bg-amber-500"
                : strength <= 3 ? "bg-violet-400"
                : "bg-emerald-500"
                : "bg-zinc-800"
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5 text-[11px]">
            <Check size={10} className={check.met ? "text-emerald-500" : "text-zinc-700"} />
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
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoValidation, setPromoValidation] = useState<{
    status: 'idle' | 'loading' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  const promoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validatePromoCode = useCallback((code: string) => {
    if (promoDebounceRef.current) {
      clearTimeout(promoDebounceRef.current);
    }

    if (!code.trim()) {
      setPromoValidation({ status: 'idle' });
      return;
    }

    setPromoValidation({ status: 'loading' });

    promoDebounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get(`/api/v1/promo/validate?code=${encodeURIComponent(code.trim())}`);
        const data = response.data;
        setPromoValidation({
          status: 'valid',
          message: data.message || `Valid! You'll receive ${data.credits || 50} credits.`,
        });
      } catch {
        setPromoValidation({
          status: 'invalid',
          message: 'Invalid promotional code.',
        });
      }
    }, 500);
  }, []);

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
      const promoParam = data.promoCode && promoValidation.status === 'valid'
        ? `&promo=${encodeURIComponent(data.promoCode.trim())}`
        : '';
      router.push(`/login?registered=true${promoParam}`);
    } catch {
      setError('Registration failed. This email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-2.5 rounded-lg text-[15px]",
    "bg-zinc-900/50 border border-zinc-800/80",
    "text-white placeholder:text-zinc-600",
    "focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/15",
    "transition-all duration-150"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Create your account
        </h1>
        <p className="text-zinc-500 text-[15px] mt-2">
          Start validating your AI training data
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm leading-relaxed">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name + Email row on larger form widths */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[13px] font-medium text-zinc-400">
              Full name
            </label>
            <input
              {...register('name')}
              id="name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              className={cn(inputClasses, errors.name && "border-red-500/40")}
            />
            {errors.name && (
              <p className="text-[11px] text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="company" className="block text-[13px] font-medium text-zinc-400">
              Company <span className="text-zinc-700">(optional)</span>
            </label>
            <input
              {...register('company')}
              id="company"
              type="text"
              placeholder="Acme Inc."
              autoComplete="organization"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Email - full width */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[13px] font-medium text-zinc-400">
            Work email
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className={cn(inputClasses, errors.email && "border-red-500/40")}
          />
          {errors.email && (
            <p className="text-[11px] text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password + Confirm row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-zinc-400">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className={cn(inputClasses, "pr-11", errors.password && "border-red-500/40")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-zinc-400">
              Confirm password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                autoComplete="new-password"
                className={cn(inputClasses, "pr-11", errors.confirmPassword && "border-red-500/40")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Password strength */}
        <PasswordStrength password={password} />

        {/* Promo Code */}
        <div>
          <button
            type="button"
            onClick={() => setShowPromoCode(!showPromoCode)}
            className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            <Tag size={12} />
            <span>Have a promo code?</span>
            <ChevronDown
              size={12}
              className={cn("transition-transform duration-200", showPromoCode && "rotate-180")}
            />
          </button>
          <AnimatePresence>
            {showPromoCode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-1.5">
                  <div className="relative">
                    <input
                      {...register('promoCode')}
                      id="promoCode"
                      type="text"
                      placeholder="Enter promo code"
                      onChange={(e) => {
                        register('promoCode').onChange(e);
                        validatePromoCode(e.target.value);
                      }}
                      className={cn(
                        inputClasses, "pr-10 uppercase tracking-wider",
                        promoValidation.status === 'valid' && "border-emerald-500/40",
                        promoValidation.status === 'invalid' && "border-red-500/40"
                      )}
                    />
                    {promoValidation.status === 'loading' && (
                      <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" size={15} />
                    )}
                    {promoValidation.status === 'valid' && (
                      <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={15} />
                    )}
                    {promoValidation.status === 'invalid' && (
                      <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500" size={15} />
                    )}
                  </div>
                  {promoValidation.status === 'valid' && promoValidation.message && (
                    <p className="text-[11px] text-emerald-400">{promoValidation.message}</p>
                  )}
                  {promoValidation.status === 'invalid' && promoValidation.message && (
                    <p className="text-[11px] text-red-400">{promoValidation.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg font-medium text-[15px] mt-1",
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
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-[12px] text-zinc-600 text-center leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-zinc-500 hover:text-violet-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-zinc-500 hover:text-violet-400 transition-colors">Privacy Policy</Link>
        </p>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-[14px] text-zinc-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
