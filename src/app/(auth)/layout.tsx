'use client';

import { motion } from 'framer-motion';
import { AuthProvider } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

// Animated geometric shapes for background
function FloatingShape({
  className,
  delay = 0,
  size = 100,
  gradient = 'from-violet/20',
}: {
  className?: string;
  delay?: number;
  size?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
      className={cn('absolute pointer-events-none', className)}
    >
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size }}
        className={cn(
          'rounded-full bg-gradient-to-br to-transparent blur-2xl',
          gradient
        )}
      />
    </motion.div>
  );
}

// Star burst decoration
function StarBurst({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -45 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      className={cn('absolute pointer-events-none', className)}
    >
      <svg width="200" height="200" viewBox="0 0 200 200" className="text-violet/30">
        {[...Array(12)].map((_, i) => (
          <motion.line
            key={i}
            x1="100"
            y1="100"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="1"
            transform={`rotate(${i * 30} 100 100)`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8 + i * 0.05 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1e] via-[#0f1629] to-[#141c33] overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet/5 via-transparent to-mint/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent" />
        
        {/* Animated floating shapes */}
        <FloatingShape
          delay={0}
          size={400}
          gradient="from-violet/15"
          className="left-[-10%] top-[10%]"
        />
        <FloatingShape
          delay={0.3}
          size={300}
          gradient="from-mint/10"
          className="right-[-5%] top-[60%]"
        />
        <FloatingShape
          delay={0.5}
          size={200}
          gradient="from-rose-500/10"
          className="left-[20%] bottom-[5%]"
        />
        <FloatingShape
          delay={0.7}
          size={150}
          gradient="from-amber-500/10"
          className="right-[25%] top-[5%]"
        />

        {/* Star burst decoration */}
        <StarBurst className="right-[10%] bottom-[20%]" />
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl px-4 flex items-center justify-center">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
