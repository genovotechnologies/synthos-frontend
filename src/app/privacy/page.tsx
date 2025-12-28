'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
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
              <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                Synthos (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our AI 
                Validation Platform.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <p className="leading-relaxed mb-4">We collect information in the following ways:</p>
              
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Account Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Name and email address</li>
                <li>Company name and role</li>
                <li>Account credentials (encrypted)</li>
                <li>Billing information</li>
              </ul>
              
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Usage Data</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Validation history and results</li>
                <li>Feature usage patterns</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
              </ul>
              
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Dataset Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dataset metadata (size, format, structure)</li>
                <li>Validation metrics and scores</li>
                <li>Note: We do not retain your actual dataset content after validation is complete</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain our Service</li>
                <li>To process your validation requests</li>
                <li>To send you service-related communications</li>
                <li>To improve our algorithms and service quality</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
              <p className="leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Regular security audits and penetration testing</li>
                <li>Role-based access controls</li>
                <li>Secure, SOC 2 compliant infrastructure</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your account information for as long as your account is active. Validation results 
                and history are retained for 2 years or until you request deletion. Dataset content is 
                automatically deleted within 30 days of validation completion unless you explicitly request 
                extended retention.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">6. Data Sharing</h2>
              <p className="leading-relaxed mb-4">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Service providers who assist in operating our platform</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your explicit consent</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
              <p className="leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">8. Cookies</h2>
              <p className="leading-relaxed">
                We use essential cookies to maintain your session and preferences. Analytics cookies help us 
                understand how you use our Service. You can control cookie preferences through your browser 
                settings.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">9. Contact Us</h2>
              <p className="leading-relaxed">
                For privacy-related inquiries, please contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@synthos.ai" className="text-violet-400 hover:text-violet-300 transition-colors">
                  privacy@synthos.ai
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
