'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <SynthosLogo size={32} />
            <span className="text-lg font-semibold text-white">Synthos</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">Refund Policy</h1>
          <p className="text-zinc-400">Last updated: April 2026</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-invert prose-zinc max-w-none"
        >
          <div className="space-y-8 text-zinc-300">
            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <p className="leading-relaxed text-lg">
                At Synthos, we want you to be completely satisfied with your
                purchase.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">
                Full Refund Window
              </h2>
              <p className="leading-relaxed">
                You may request a full refund within 14 days of the purchase
                date. No questions asked.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">
                How to Request a Refund
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Email{' '}
                  <a
                    href="mailto:support@synthos.dev"
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    support@synthos.dev
                  </a>{' '}
                  with your account email and purchase details
                </li>
                <li>
                  Or submit a support ticket through your Synthos dashboard
                </li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">
                Processing
              </h2>
              <p className="leading-relaxed">
                All payments and refunds are processed by{' '}
                <a
                  href="https://paddle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Paddle
                </a>{' '}
                (paddle.com), our Merchant of Record. Refunds are typically
                processed within 5-10 business days and returned to your
                original payment method.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
              <p className="leading-relaxed">
                For any questions about refunds, contact us at{' '}
                <a
                  href="mailto:support@synthos.dev"
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  support@synthos.dev
                </a>
                .
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
