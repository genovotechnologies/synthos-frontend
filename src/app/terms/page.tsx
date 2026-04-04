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
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed mb-4">
                By accessing and using the Synthos AI Validation Platform (&quot;Service&quot;), operated by Genovo Technologies (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you accept and agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
              </p>
              <p className="leading-relaxed">
                If you do not agree to these Terms, you must not access or use the Service. We reserve the right to update these Terms at any time, and we will notify you of material changes via email or in-app notification.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="leading-relaxed mb-4">
                Synthos provides AI training data validation services designed to detect and prevent model collapse in machine learning pipelines. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Model collapse detection and prevention through multi-scale cascade validation</li>
                <li>Dataset quality analysis, scoring, and comprehensive reporting</li>
                <li>Training outcome prediction with 90%+ accuracy confidence intervals</li>
                <li>Performance warranties backed by financial guarantees on validated datasets</li>
                <li>API access for programmatic integration with your ML pipelines</li>
                <li>Support ticketing and technical assistance</li>
              </ul>
              <p className="leading-relaxed">
                The Service is provided &quot;as available&quot; and may be updated, modified, or discontinued at our discretion with reasonable notice to active users.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">3. Account Terms</h2>
              <p className="leading-relaxed mb-4">To use the Service, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Be at least 18 years of age or the legal age in your jurisdiction</li>
                <li>Register with a valid email address and verify your identity via OTP</li>
                <li>Provide accurate, current, and complete registration information</li>
                <li>Maintain the security and confidentiality of your account credentials and API keys</li>
                <li>Promptly notify us of any unauthorized access to your account</li>
              </ul>
              <p className="leading-relaxed mb-4">
                You are solely responsible for all activity that occurs under your account. We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe have been compromised.
              </p>
              <p className="leading-relaxed">
                Each individual must maintain only one account. Shared or team accounts should be managed through a single organizational registration.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
              <p className="leading-relaxed mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Upload datasets containing illegal, harmful, or infringing content</li>
                <li>Attempt to reverse engineer, decompile, or extract our proprietary validation algorithms</li>
                <li>Circumvent rate limits, access controls, or security mechanisms</li>
                <li>Use automated systems to scrape, mine, or overload the Service</li>
                <li>Share API keys or account credentials with unauthorized third parties</li>
                <li>Submit datasets that contain personally identifiable information (PII) without proper consent and data processing agreements in place</li>
                <li>Interfere with or disrupt the integrity of the Service or its underlying infrastructure</li>
                <li>Use the Service for any purpose that violates applicable law or regulation</li>
              </ul>
              <p className="leading-relaxed">
                We reserve the right to investigate and take appropriate action, including suspending your account, if we determine that you have violated these terms.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">5. Credits and Billing</h2>
              <p className="leading-relaxed mb-4">
                The Service operates on a credit-based billing system:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Credit Purchases:</strong> Credits are purchased through our platform via Paddle (our payment processor). All prices are displayed in USD and are exclusive of applicable taxes.</li>
                <li><strong className="text-white">Credit Consumption:</strong> Each validation operation consumes credits based on the dataset size and validation type selected. Credit costs are displayed before you confirm any operation.</li>
                <li><strong className="text-white">Non-Refundable:</strong> Purchased credits are non-refundable except where required by applicable law or in the case of documented Service errors that prevented credit usage.</li>
                <li><strong className="text-white">Expiration:</strong> Credits do not expire as long as your account remains active and in good standing.</li>
                <li><strong className="text-white">Promotional Credits:</strong> Promotional or bonus credits may have specific expiration dates and usage restrictions as stated at the time of issuance.</li>
              </ul>
              <p className="leading-relaxed">
                Failed validations due to Service errors (not user error) will result in automatic credit refund. We will notify you of any billing changes with at least 30 days advance notice.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">6. Data Handling and Privacy</h2>
              <p className="leading-relaxed mb-4">
                We take data security and privacy seriously:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>All datasets uploaded for validation are encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Dataset content is processed solely for the purpose of providing the requested validation services</li>
                <li>We do not use your datasets to train our own models or share them with third parties</li>
                <li>Dataset files are automatically deleted within 30 days of validation completion unless you request extended retention</li>
                <li>Validation results and metadata are retained for 2 years for your reference</li>
                <li>You retain full ownership and intellectual property rights to your uploaded data</li>
              </ul>
              <p className="leading-relaxed">
                For more details, please review our{' '}
                <Link href="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2">
                  Privacy Policy
                </Link>.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">Our IP:</strong> The Service, including its multi-scale cascade validation technology, collapse signature library, prediction algorithms, user interface, documentation, and all related intellectual property, is owned by Genovo Technologies and protected by applicable copyright, patent, and trade secret laws. You may not copy, modify, distribute, or create derivative works based on our technology.
              </p>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">Your Data:</strong> You retain all ownership rights to the datasets you upload and the data contained within them. By using the Service, you grant us a limited, non-exclusive license to process your data solely for the purpose of providing the validation services you request.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Validation Reports:</strong> Validation reports generated by the Service are provided to you under a perpetual, royalty-free license for your internal use. You may share reports with third parties (e.g., investors, partners) but may not resell them.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">8. Performance Warranties</h2>
              <p className="leading-relaxed mb-4">
                Synthos offers performance warranties on validated datasets under the following conditions:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Warranties are available only for datasets that pass comprehensive validation with a risk score below the warranty threshold</li>
                <li>Warranty coverage amounts and accuracy thresholds are specified at the time of warranty issuance</li>
                <li>Warranty claims must be submitted within the warranty validity period (typically 6 months from issuance)</li>
                <li>Claims are subject to technical verification by our team, including review of your training process and configuration</li>
                <li>Warranties do not cover failures caused by modifications to the dataset after validation, incorrect training configurations, or hardware/infrastructure issues</li>
              </ul>
              <p className="leading-relaxed">
                Warranty terms, including maximum coverage amounts and claim procedures, are detailed in the warranty agreement provided at the time of issuance.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
              <p className="leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Synthos shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill</li>
                <li>Our total aggregate liability arising from or related to the Service shall not exceed the greater of (a) the amount you paid to Synthos in the 12 months preceding the claim, or (b) $100 USD</li>
                <li>We are not liable for any losses resulting from your reliance on validation results in ways inconsistent with our documented recommendations</li>
                <li>Separate liability terms apply to performance warranty claims as specified in the warranty agreement</li>
              </ul>
              <p className="leading-relaxed">
                Some jurisdictions do not allow the exclusion of certain warranties or limitations on liability. In such cases, these limitations shall apply to the fullest extent permitted by applicable law.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">By You:</strong> You may close your account at any time through the dashboard settings or by contacting support. Upon termination, your remaining credits are forfeited, and your data will be deleted according to our retention policy.
              </p>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">By Us:</strong> We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, fail to pay for purchased services, or if we are required to do so by law. We will provide reasonable notice where possible.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Effect of Termination:</strong> Upon termination, your right to use the Service ceases immediately. Sections relating to intellectual property, limitation of liability, and governing law survive termination.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">11. Governing Law and Dispute Resolution</h2>
              <p className="leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
              </p>
              <p className="leading-relaxed mb-4">
                Any disputes arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.
              </p>
              <p className="leading-relaxed">
                Nothing in this section prevents either party from seeking injunctive or equitable relief in a court of competent jurisdiction for matters relating to intellectual property rights or data security.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">12. Modifications to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes at least 30 days in advance via email or in-app notification. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms. If you do not agree to the modified Terms, you should discontinue use of the Service before the changes take effect.
              </p>
            </section>

            <section className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
              <h2 className="text-xl font-semibold text-white mb-4">13. Contact</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@synthos.dev" className="text-violet-400 hover:text-violet-300 transition-colors">
                  legal@synthos.dev
                </a>
                {' '}or through our{' '}
                <Link href="/support" className="text-violet-400 hover:text-violet-300 transition-colors">
                  support portal
                </Link>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
