import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Synthos',
  description:
    'Simple, transparent pricing for AI training data validation. Credit-based plans from $1,500 to enterprise.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
