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
          <p className="text-zinc-400">Last updated: January 15, 2026</p>
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
              <p className="leading-relaxed mb-4">
                Synthos, operated by Genovo Technologies (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI Validation Platform (&quot;Service&quot;).
              </p>
              <p className="leading-relaxed">
                By using the Service, you consent to the data practices described in this policy. If you do not agree with the practices described here, please do not use the Service.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-white mt-4 mb-2">2.1 Account Information</h3>
              <p className="leading-relaxed mb-2">When you create an account, we collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Full name and email address</li>
                <li>Company name and job role</li>
                <li>Password (stored using bcrypt hashing; we never store plaintext passwords)</li>
                <li>Email verification status</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-4 mb-2">2.2 Uploaded Datasets</h3>
              <p className="leading-relaxed mb-2">When you upload datasets for validation, we process:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Dataset files and their content (for validation processing only)</li>
                <li>File metadata including name, size, format, and row count</li>
                <li>Validation results, risk scores, and quality metrics</li>
                <li>Generated validation reports</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-4 mb-2">2.3 Usage Data</h3>
              <p className="leading-relaxed mb-2">We automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>API call logs including endpoints accessed, timestamps, and response codes</li>
                <li>Feature usage patterns and interaction metrics</li>
                <li>Browser type, operating system, and device information</li>
                <li>IP address and approximate geographic location</li>
                <li>Referral URLs and pages visited within the Service</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-4 mb-2">2.4 Billing Information</h3>
              <p className="leading-relaxed mb-2">When you purchase credits, our payment processor (Paddle) collects:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment card or payment method details (processed and stored by Paddle; we do not store card numbers)</li>
                <li>Billing address and tax information</li>
                <li>Transaction history and invoice records</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Information</h2>
              <p className="leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Provide the Service:</strong> Process validation requests, generate reports, and deliver results</li>
                <li><strong className="text-white">Account Management:</strong> Authenticate users, manage sessions, and process billing</li>
                <li><strong className="text-white">Communications:</strong> Send transactional emails (verification, validation completion, warranty alerts) and optional marketing communications</li>
                <li><strong className="text-white">Improvement:</strong> Analyze usage patterns to improve our validation algorithms, user interface, and service reliability</li>
                <li><strong className="text-white">Security:</strong> Detect and prevent fraud, abuse, and unauthorized access</li>
                <li><strong className="text-white">Legal Compliance:</strong> Fulfill legal obligations and respond to lawful requests</li>
                <li><strong className="text-white">Support:</strong> Respond to support tickets and provide technical assistance</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
              <p className="leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Encryption:</strong> AES-256 encryption for data at rest; TLS 1.3 for data in transit</li>
                <li><strong className="text-white">Infrastructure:</strong> Hosted on Google Cloud Platform (GCP) with SOC 2 Type II compliance</li>
                <li><strong className="text-white">Access Control:</strong> Role-based access controls with least-privilege principles for all internal systems</li>
                <li><strong className="text-white">Monitoring:</strong> 24/7 security monitoring, intrusion detection, and automated alerting</li>
                <li><strong className="text-white">Auditing:</strong> Regular security audits and penetration testing by independent third parties</li>
                <li><strong className="text-white">Backups:</strong> Encrypted, geographically redundant backups with tested recovery procedures</li>
              </ul>
              <p className="leading-relaxed">
                While we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but are committed to implementing and maintaining reasonable safeguards.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p className="leading-relaxed mb-4">We retain your data according to the following schedule:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Account Data:</strong> Retained for as long as your account is active, plus 30 days after account closure</li>
                <li><strong className="text-white">Dataset Content:</strong> Automatically deleted within 30 days of validation completion. You may request immediate deletion at any time.</li>
                <li><strong className="text-white">Validation Results:</strong> Retained for 2 years from completion date for your reference and warranty purposes</li>
                <li><strong className="text-white">Transaction History:</strong> Retained for 7 years as required by financial regulations</li>
                <li><strong className="text-white">Usage Logs:</strong> Retained for 90 days for security and debugging purposes</li>
                <li><strong className="text-white">Support Tickets:</strong> Retained for 3 years from resolution date</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">6. Third-Party Services</h2>
              <p className="leading-relaxed mb-4">
                We use the following third-party services to operate the platform. Each has their own privacy policy:
              </p>
              <ul className="list-disc list-inside space-y-3 ml-4">
                <li>
                  <strong className="text-white">Google Cloud Platform (GCP):</strong> Infrastructure hosting, data storage, and compute services. Data may be processed in GCP regions as configured for your account.
                </li>
                <li>
                  <strong className="text-white">Paddle:</strong> Payment processing and subscription management. Paddle acts as our Merchant of Record and handles all payment card data.
                </li>
                <li>
                  <strong className="text-white">Resend:</strong> Transactional email delivery (verification codes, validation notifications, password resets). Receives your email address and name.
                </li>
              </ul>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="leading-relaxed mb-4">We use the following types of cookies and similar technologies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Essential Cookies:</strong> Required for authentication, session management, and security. Cannot be disabled.</li>
                <li><strong className="text-white">Functional Cookies:</strong> Remember your preferences such as theme settings and notification choices.</li>
                <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how you use the Service to improve user experience. These can be disabled.</li>
              </ul>
              <p className="leading-relaxed">
                We do not use third-party advertising cookies or tracking pixels. You can manage cookie preferences through your browser settings. Disabling essential cookies may affect your ability to use the Service.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">8. Your Rights</h2>
              <p className="leading-relaxed mb-4">
                Depending on your jurisdiction, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong className="text-white">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                <li><strong className="text-white">Portability:</strong> Request your data in a machine-readable format (JSON) for transfer to another service</li>
                <li><strong className="text-white">Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong className="text-white">Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong className="text-white">Marketing Opt-Out:</strong> Unsubscribe from marketing communications at any time via email preferences or account settings</li>
              </ul>
              <p className="leading-relaxed">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@synthos.dev" className="text-violet-400 hover:text-violet-300 transition-colors">
                  privacy@synthos.dev
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">9. International Data Transfers</h2>
              <p className="leading-relaxed">
                Your data may be processed in countries other than your country of residence, including the United States. We ensure that appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) where required by GDPR, to protect your data in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
              <p className="leading-relaxed">
                The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal data, please contact us and we will take steps to delete such information.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">11. Updates to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a revised &quot;last updated&quot; date and, for significant changes, by sending you an email notification. We encourage you to review this page periodically to stay informed about how we protect your data.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
              <p className="leading-relaxed mb-4">
                For privacy-related inquiries, data access requests, or to report a concern, please contact our Data Protection Officer:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li>
                  Email:{' '}
                  <a href="mailto:privacy@synthos.dev" className="text-violet-400 hover:text-violet-300 transition-colors">
                    privacy@synthos.dev
                  </a>
                </li>
                <li>
                  Support:{' '}
                  <Link href="/support" className="text-violet-400 hover:text-violet-300 transition-colors">
                    synthos.dev/support
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
