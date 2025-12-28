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
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, CheckCircle, Shield, Zap, BarChart3 } from 'lucide-react';

// A07:2021 - Identification and Authentication Failures: Strong password requirements
const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

// Neumorphic Input Component
function NeumorphicInput({
  id,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  ...props
}: {
  id: string;
  type?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative rounded-xl transition-all duration-300",
          "bg-[#1a1f2e]",
          "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.05)]",
          isFocused && "ring-2 ring-violet/50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.05),0_0_20px_rgba(108,92,231,0.3)]",
          error && "ring-2 ring-red-500/50"
        )}
      >
        {Icon && (
          <Icon
            size={18}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
              isFocused ? "text-violet" : "text-white/40"
            )}
          />
        )}
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full bg-transparent py-3.5 text-white placeholder:text-white/30",
            "focus:outline-none",
            Icon ? "pl-12 pr-4" : "px-4",
            isPassword && "pr-12"
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Lowercase', valid: /[a-z]/.test(password) },
    { label: 'Uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
    { label: 'Special char', valid: /[^a-zA-Z0-9]/.test(password) },
  ];

  const strength = checks.filter(c => c.valid).length;
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 3 ? 'bg-yellow-500' : 'bg-mint';

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-3"
    >
      {/* Strength bar */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < strength ? strengthColor : "bg-white/10"
            )}
          />
        ))}
      </div>
      
      {/* Requirements */}
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              check.valid ? "text-mint" : "text-white/40"
            )}
          >
            {check.valid ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
            {check.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Feature cards for the right side
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      className="glass-dark rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-violet/20">
          <Icon size={24} className="text-violet" />
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-white/50">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-8 w-full justify-center">
      {/* Left: Register Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-dark rounded-3xl p-8 md:p-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-violet/30 blur-xl rounded-full" />
            <SynthosLogo size={40} className="relative" />
          </div>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-white/50">Start validating your AI training data</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm text-white/70 block mb-2">Full Name</label>
            <NeumorphicInput
              id="name"
              type="text"
              placeholder="John Doe"
              icon={User}
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-white/70 block mb-2">Work Email</label>
            <NeumorphicInput
              id="email"
              type="email"
              placeholder="you@company.com"
              icon={Mail}
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company" className="text-sm text-white/70 block mb-2">Company (Optional)</label>
            <NeumorphicInput
              id="company"
              type="text"
              placeholder="Acme Inc."
              icon={Building2}
              autoComplete="organization"
              error={errors.company?.message}
              {...register('company')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-white/70 block mb-2">Password</label>
            <NeumorphicInput
              id="password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm text-white/70 block mb-2">Confirm Password</label>
            <NeumorphicInput
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {/* Create Account Button - Electric Violet Glow */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 mt-6",
              "bg-gradient-to-r from-violet to-violet/80 text-white",
              // Neumorphic extruded shadows + violet glow
              "shadow-[4px_4px_12px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.05),0_0_30px_rgba(108,92,231,0.3)]",
              // Hover - intensify glow
              "hover:shadow-[2px_2px_8px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(255,255,255,0.05),0_0_40px_rgba(108,92,231,0.5)]",
              "hover:scale-[1.01]",
              // Active - pressed in
              "active:scale-[0.98] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>

          {/* Terms */}
          <p className="text-xs text-white/40 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-violet hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-violet hover:underline">Privacy Policy</Link>
          </p>
        </form>

        {/* Sign in link */}
        <p className="text-center text-sm text-white/50 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-mint hover:text-mint/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>

      {/* Right: Features */}
      <div className="hidden lg:flex flex-col gap-4 w-full max-w-sm pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Why Synthos?</h2>
          <p className="text-white/50">Enterprise-grade AI data validation</p>
        </motion.div>

        <FeatureCard
          icon={Shield}
          title="Data Warranties"
          description="Get insured guarantees on your synthetic data quality"
          delay={0.3}
        />
        <FeatureCard
          icon={Zap}
          title="Real-time Validation"
          description="Validate millions of rows in minutes, not hours"
          delay={0.4}
        />
        <FeatureCard
          icon={BarChart3}
          title="Risk Analytics"
          description="Comprehensive risk scores across 12+ dimensions"
          delay={0.5}
        />

        {/* Trusted by */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-4 text-center"
        >
          <p className="text-white/30 text-sm mb-3">Trusted by leading AI teams</p>
          <div className="flex justify-center gap-6 text-white/20">
            {['ACME', 'TechCo', 'AI Labs'].map((name) => (
              <span key={name} className="text-sm font-medium">{name}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
