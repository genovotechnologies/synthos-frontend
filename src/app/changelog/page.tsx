import type { Metadata } from 'next';
import { CHANGELOG } from '@/content/changelog';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { SiteFooter } from '@/components/marketing/site-footer';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'What shipped in Synthos — new capabilities for AI training data validation, collapse detection, and the platform around them.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    type: 'website',
    url: 'https://synthos.dev/changelog',
    title: 'Synthos Changelog',
    description: 'What shipped in Synthos, release by release.',
  },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <MarketingNav />

      <div className="container mx-auto px-4 flex-1 w-full max-w-3xl">
        <header className="py-14">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Changelog</h1>
          <p className="text-zinc-500 mt-3">What shipped, when. Anchors are stable — link freely.</p>
        </header>

        <section className="pb-20 space-y-12">
          {CHANGELOG.map((entry) => (
            <article key={entry.anchor} id={entry.anchor} className="scroll-mt-24 grid sm:grid-cols-[140px_1fr] gap-x-8 gap-y-2">
              <p className="text-[13px] text-zinc-600 tabular-nums pt-0.5">{formatDate(entry.date)}</p>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  <a href={`#${entry.anchor}`} className="hover:text-violet-300 transition-colors">
                    {entry.title}
                  </a>
                </h2>
                <ul className="mt-3 space-y-2">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                      <span className="mt-[0.6em] w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
