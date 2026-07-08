'use client';

import Link from 'next/link';
import { SynthosLogoWithText } from '@/components/ui/synthos-logo';

const footerLinks = [
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'API Docs', href: '/docs' },
  { name: 'Status', href: '/status' },
  { name: 'Terms', href: '/terms' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Refund Policy', href: '/refund-policy' },
];

export function SiteFooter() {
  return (
    <footer className="py-12 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <SynthosLogoWithText logoSize={36} showTagline />
            <p className="text-xs text-white/60">
              SynthOS is a product of{' '}
              <a
                href="https://www.genovotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
              >
                Genovo Technologies
              </a>
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm text-white/50">
              {footerLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="hover:text-white/80 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <a
                href="https://www.genovotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80 transition-colors"
              >
                Genovo Technologies
              </a>
            </div>
            <p className="text-sm text-white/50">
              © 2026 Genovo Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
