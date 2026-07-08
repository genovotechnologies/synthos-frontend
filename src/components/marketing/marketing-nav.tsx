import Link from 'next/link';
import { SynthosLogoWithText } from '@/components/ui/synthos-logo';

/**
 * Lightweight server-renderable nav for content pages (blog, changelog).
 * Matches the pricing page's inline-nav pattern.
 */
export function MarketingNav() {
  return (
    <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
      <Link href="/">
        <SynthosLogoWithText logoSize={30} />
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/blog" className="text-zinc-400 hover:text-white transition-colors">Blog</Link>
        <Link href="/changelog" className="text-zinc-400 hover:text-white transition-colors">Changelog</Link>
        <Link href="/pricing" className="hidden sm:inline text-zinc-400 hover:text-white transition-colors">Pricing</Link>
        <Link href="/docs" className="hidden sm:inline text-zinc-400 hover:text-white transition-colors">API Docs</Link>
        <Link
          href="/register"
          className="px-4 py-1.5 rounded-full text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
