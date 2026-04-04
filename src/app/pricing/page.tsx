'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { ArrowLeft, ArrowRight, Check, Sparkles, Zap } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    price: '$1,500',
    credits: '50',
    bonus: null,
    description: 'For individual researchers',
    popular: false,
    features: [
      'Up to 500GB uploads',
      'Standard validation',
      'Email support',
      'API access',
    ],
  },
  {
    name: 'Professional',
    price: '$5,000',
    credits: '500',
    bonus: '+100 bonus',
    description: 'For growing teams',
    popular: true,
    features: [
      'Everything in Starter',
      'Priority validation',
      'Webhook notifications',
      'Team management',
    ],
  },
  {
    name: 'Business',
    price: '$20,000',
    credits: '2,500',
    bonus: '+500 bonus',
    description: 'For enterprise validation',
    popular: false,
    features: [
      'Everything in Professional',
      'Custom validation profiles',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
  {
    name: 'Enterprise',
    price: '$80,000',
    credits: '15,000',
    bonus: '+5,000 bonus',
    description: 'Unlimited-scale with dedicated support',
    popular: false,
    features: [
      'Everything in Business',
      'Custom integrations',
      'On-premise option',
      '24/7 priority support',
      'Custom contracts',
    ],
  },
];

const creditCosts = [
  { operation: 'Standard validation', credits: 25 },
  { operation: 'Express validation', credits: 50 },
  { operation: 'Warranty request', credits: 15 },
  { operation: 'Re-validation', credits: 20 },
];

const included = [
  'SSL encryption',
  'SOC 2 compliance',
  '99.9% uptime SLA',
  'Data residency options',
];

const faqs = [
  {
    q: 'What are credits?',
    a: 'Credits are used to run validation jobs. Each validation consumes credits based on priority level.',
  },
  {
    q: 'Can I upgrade my plan?',
    a: 'Yes, you can purchase additional credit packages at any time.',
  },
  {
    q: 'What happens when I run out of credits?',
    a: "You'll be notified and can purchase more. Active validations will complete.",
  },
  {
    q: 'Do credits expire?',
    a: 'No, credits never expire.',
  },
  {
    q: "What's your refund policy?",
    a: 'We offer a full refund within 14 days of purchase, no questions asked.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Subtle grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <SynthosLogo size={32} />
              <span className="text-lg font-semibold text-white">Synthos</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>
          </div>
        </nav>

        {/* Header */}
        <div className="container mx-auto px-4 max-w-6xl pt-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="text-xs text-zinc-400 tracking-wide">
                Credit-based pricing
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5">
              <span className="text-white">Simple, transparent</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-violet-300">
                pricing
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-lg mx-auto">
              Pay for what you use. Purchase credit packages and spend them on
              validations at your own pace. No subscriptions, no surprises.
            </p>
          </motion.div>

          {/* Pricing Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-16"
          >
            {tiers.map((tier, i) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-px ${
                  tier.popular
                    ? 'bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent'
                    : 'bg-white/[0.06]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-violet-500 text-white text-[11px] font-semibold tracking-wide uppercase px-3 py-1 rounded-full">
                      <Zap size={10} className="fill-current" />
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className={`h-full rounded-2xl p-6 flex flex-col ${
                    tier.popular
                      ? 'bg-[#0f0f12]'
                      : 'bg-zinc-900/50'
                  }`}
                >
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-1">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {tier.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-300 font-medium">
                        {tier.credits} credits
                      </span>
                      {tier.bonus && (
                        <span className="text-violet-400 text-xs font-medium bg-violet-500/10 px-1.5 py-0.5 rounded">
                          {tier.bonus}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-2">
                      {tier.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          size={14}
                          className={`mt-0.5 flex-shrink-0 ${
                            tier.popular
                              ? 'text-violet-400'
                              : 'text-zinc-500'
                          }`}
                        />
                        <span className="text-sm text-zinc-300">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 block ${
                      tier.popular
                        ? 'bg-violet-500 hover:bg-violet-400 text-white'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.06]'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Credit Costs */}
        <div className="border-t border-white/[0.04]">
          <div className="container mx-auto px-4 max-w-6xl py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                Credit cost breakdown
              </h2>
              <p className="text-zinc-500 text-sm text-center mb-10">
                Each operation consumes a fixed number of credits
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {creditCosts.map((item) => (
                  <div
                    key={item.operation}
                    className="text-center p-5 rounded-xl border border-white/[0.06] bg-zinc-900/30"
                  >
                    <div className="text-2xl font-bold text-white mb-1">
                      {item.credits}
                    </div>
                    <div className="text-xs text-zinc-500">credits</div>
                    <div className="text-sm text-zinc-300 mt-2">
                      {item.operation}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* All Plans Include */}
        <div className="border-t border-white/[0.04]">
          <div className="container mx-auto px-4 max-w-6xl py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-xl font-semibold text-white mb-8">
                All plans include
              </h2>
              <div className="flex flex-wrap justify-center gap-6">
                {included.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-zinc-400"
                  >
                    <Check size={14} className="text-violet-400" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* FAQ */}
        <div className="border-t border-white/[0.04]">
          <div className="container mx-auto px-4 max-w-2xl py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-10 text-center">
                Frequently asked questions
              </h2>
              <div className="space-y-6">
                {faqs.map((faq) => (
                  <div
                    key={faq.q}
                    className="pb-6 border-b border-white/[0.06] last:border-0"
                  >
                    <h3 className="text-sm font-medium text-white mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-white/[0.04]">
          <div className="container mx-auto px-4 max-w-6xl py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-3">
                Ready to validate?
              </h2>
              <p className="text-zinc-500 text-sm mb-8">
                Create your account and purchase credits to get started.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
              <p>&copy; 2025 Genovo Technologies. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link
                  href="/terms"
                  className="hover:text-zinc-300 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-zinc-300 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/refund-policy"
                  className="hover:text-zinc-300 transition-colors"
                >
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
