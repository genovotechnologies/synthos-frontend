'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/providers/auth-provider';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { Shield, Zap, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Collapse Detection',
    description: 'Identify model collapse risks before they impact training outcomes',
  },
  {
    icon: Zap,
    title: '90%+ Accuracy',
    description: 'Industry-leading prediction accuracy across all validation dimensions',
  },
  {
    icon: BarChart3,
    title: 'Quality Warranties',
    description: 'Financial guarantees backed by validated data quality scores',
  },
];

function BrandPanel() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0b]" />

      {/* Gradient mesh */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(167, 139, 250, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <SynthosLogo size={28} />
          <span className="text-lg font-semibold text-white tracking-tight">Synthos</span>
        </Link>

        {/* Main message */}
        <div className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-[28px] leading-[1.2] font-medium text-white tracking-tight">
              {isLogin
                ? 'Build collapse-proof models faster.'
                : 'Start validating in minutes.'}
            </h2>
            <p className="text-[15px] text-zinc-400 leading-relaxed max-w-sm">
              {isLogin
                ? 'Synthos validates your AI training data before it costs you. Detect issues early, ship with confidence.'
                : 'Join teams using Synthos to validate synthetic data quality and prevent training failures before they happen.'}
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-start gap-3.5"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon size={15} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{feature.title}</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>Trusted by AI teams worldwide</span>
          <span>synthos.dev</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex bg-[#0a0a0b]">
        <BrandPanel />

        {/* Form side */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Subtle background for form side */}
          <div className="absolute inset-0 bg-zinc-950" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Mobile logo - only visible on small screens */}
          <div className="lg:hidden absolute top-6 left-6 z-20">
            <Link href="/" className="flex items-center gap-2">
              <SynthosLogo size={24} />
              <span className="text-sm font-semibold text-white tracking-tight">Synthos</span>
            </Link>
          </div>

          <div className="relative z-10 w-full max-w-[420px] px-6 py-16 lg:py-12">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
