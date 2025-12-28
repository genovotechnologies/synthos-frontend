'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-zinc-400">Last updated: December 28, 2025</p>
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
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Synthos AI Validation Platform (&quot;Service&quot;), you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="leading-relaxed mb-4">
                Synthos provides AI dataset validation services including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Model collapse detection and prevention</li>
                <li>Dataset quality analysis and scoring</li>
                <li>Training outcome prediction</li>
                <li>Performance warranties on validated datasets</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">3. User Responsibilities</h2>
              <p className="leading-relaxed mb-4">As a user of our Service, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the Service only for lawful purposes</li>
                <li>Not attempt to reverse engineer or exploit our validation algorithms</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Handling</h2>
              <p className="leading-relaxed">
                We take data security seriously. All datasets uploaded for validation are processed securely and 
                are not used for any purpose other than providing the requested validation services. Your data 
                is encrypted in transit and at rest. We do not share your data with third parties except as 
                required to provide the Service.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">5. Performance Warranties</h2>
              <p className="leading-relaxed">
                Synthos offers performance warranties on validated datasets. These warranties are subject to 
                specific terms and conditions outlined in your service agreement. Warranty claims must be 
                submitted within the specified timeframe and are subject to verification by our technical team.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, Synthos shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to loss of profits, data, 
                or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">7. Modifications</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material 
                changes via email or through the Service. Your continued use of the Service after such modifications 
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">8. Contact</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@synthos.ai" className="text-violet-400 hover:text-violet-300 transition-colors">
                  legal@synthos.ai
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
