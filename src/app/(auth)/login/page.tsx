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
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, Quote } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

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
          // Neumorphic "pressed in" effect
          "bg-[#1a1f2e]",
          "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.05)]",
          // Focus glow
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
            "w-full bg-transparent py-4 text-white placeholder:text-white/30",
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

// Testimonial Carousel for right side
function TestimonialCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      quote: "Synthos has transformed how we validate our AI training data. The risk insights are invaluable.",
      author: "Sarah Chen",
      role: "ML Engineer at TechCorp",
    },
    {
      quote: "Finally, a platform that understands the complexities of synthetic data validation.",
      author: "Marcus Johnson",
      role: "Data Scientist at AI Labs",
    },
    {
      quote: "The warranty system gives us confidence to deploy models at scale.",
      author: "Emily Rodriguez",
      role: "VP of Engineering at DataFlow",
    },
  ];

  const current = testimonials[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="hidden lg:flex flex-col glass-dark rounded-3xl p-8 w-full max-w-md h-fit"
    >
      <h2 className="text-3xl font-bold text-white mb-2">What's our</h2>
      <h2 className="text-3xl font-bold text-white mb-8">Customers Said.</h2>
      
      <div className="flex-1">
        <Quote size={32} className="text-violet mb-4" />
        <p className="text-white/70 text-lg leading-relaxed mb-6">
          "{current.quote}"
        </p>
        <div>
          <p className="text-white font-semibold">{current.author}</p>
          <p className="text-white/50 text-sm">{current.role}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => setCurrentIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))}
          className="p-3 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setCurrentIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1))}
          className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Info Card
function InfoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="hidden lg:block glass-dark rounded-2xl p-6 w-full max-w-md mt-4"
    >
      <h3 className="text-lg font-bold text-white mb-2">
        Validate your AI data with confidence
      </h3>
      <p className="text-white/50 text-sm mb-4">
        Be among the first to experience enterprise-grade synthetic data validation.
      </p>
      <div className="flex -space-x-2">
        {['#6c5ce7', '#00d9a5', '#f59e0b'].map((color, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 border-[#1a2035] flex items-center justify-center text-xs text-white font-medium"
            style={{ backgroundColor: color }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#1a2035] flex items-center justify-center text-xs text-white/70">
          +2
        </div>
      </div>
    </motion.div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-dark rounded-3xl p-8 md:p-10 w-full max-w-md"
    >
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-3 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-violet/30 blur-xl rounded-full" />
          <SynthosLogo size={40} className="relative" />
        </div>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-white/50">Please enter your account details</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <label htmlFor="email" className="text-sm text-white/70 block mb-2">Email</label>
          <NeumorphicInput
            id="email"
            type="email"
            placeholder="johndoe@gmail.com"
            icon={Mail}
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-white/70 block mb-2">Password</label>
          <NeumorphicInput
            id="password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={cn(
                "w-5 h-5 rounded-md transition-all duration-200 flex items-center justify-center",
                rememberMe 
                  ? "bg-violet shadow-lg shadow-violet/30" 
                  : "bg-[#1a1f2e] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
              )}
            >
              {rememberMe && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className="text-white"
                >
                  <path
                    fill="currentColor"
                    d="M10.28 2.72a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 0 1 1.06-1.06L4.25 7.69l4.97-4.97a.75.75 0 0 1 1.06 0Z"
                  />
                </motion.svg>
              )}
            </div>
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
              Keep me logged in
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-mint hover:text-mint/80 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button - Extruded Neumorphic */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "bg-gradient-to-r from-rose-400/90 to-rose-500/90 text-white",
            // Neumorphic extruded shadows
            "shadow-[4px_4px_12px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.05)]",
            // Hover - tighten shadows and glow
            "hover:shadow-[2px_2px_8px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(255,255,255,0.05),0_0_20px_rgba(244,63,94,0.4)]",
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
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Social Login */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#1a2035] text-white/40">or continue with</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {[
            { icon: 'G', bg: 'hover:bg-white/10' },
            { icon: 'GH', bg: 'hover:bg-white/10' },
            { icon: 'f', bg: 'hover:bg-blue-500/20' },
          ].map((social, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                "bg-[#1a1f2e] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]",
                social.bg
              )}
            >
              <span className="text-white/60 font-medium">{social.icon}</span>
            </button>
          ))}
        </div>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-white/50 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-violet hover:text-violet/80 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-start gap-6 w-full justify-center">
      {/* Left: Login Form */}
      <Suspense fallback={
        <div className="glass-dark rounded-3xl p-10 w-full max-w-md animate-pulse">
          <div className="h-10 bg-white/10 rounded mb-8 w-32" />
          <div className="h-8 bg-white/10 rounded mb-2 w-48" />
          <div className="h-4 bg-white/10 rounded mb-8 w-64" />
          <div className="space-y-4">
            <div className="h-14 bg-white/10 rounded-xl" />
            <div className="h-14 bg-white/10 rounded-xl" />
            <div className="h-14 bg-white/10 rounded-xl" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>

      {/* Right: Testimonial Section */}
      <div className="hidden lg:flex flex-col gap-4">
        <TestimonialCard />
        <InfoCard />
      </div>
    </div>
  );
}
