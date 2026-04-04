import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Synthos',
  description:
    'Synthos refund policy. Full refund within 14 days of purchase, no questions asked.',
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
