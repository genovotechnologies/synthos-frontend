import type { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/content/blog';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { SiteFooter } from '@/components/marketing/site-footer';

export const metadata: Metadata = {
  title: 'Blog — Model Collapse & AI Training Data Quality',
  description:
    'Research and engineering notes on model collapse, synthetic data validation, and AI training data quality from the Synthos team.',
  alternates: { canonical: '/blog', types: { 'application/rss+xml': '/blog/rss.xml' } },
  openGraph: {
    type: 'website',
    url: 'https://synthos.dev/blog',
    title: 'Synthos Blog — Model Collapse & AI Training Data Quality',
    description:
      'Research and engineering notes on model collapse, synthetic data validation, and AI training data quality.',
  },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <MarketingNav />

      <div className="container mx-auto px-4 flex-1 w-full max-w-3xl">
        <header className="py-14">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Blog</h1>
          <p className="text-zinc-500 mt-3 max-w-xl">
            Notes on model collapse, synthetic data validation, and keeping AI training data quality
            high enough to bet a training run on.
          </p>
        </header>

        <section className="pb-20 space-y-2">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block -mx-4 px-4 py-6 rounded-2xl hover:bg-white/[0.03] transition-colors"
              >
                <p className="text-[12px] text-zinc-600 tabular-nums">
                  {formatDate(post.date)} · {post.readingMinutes} min read
                </p>
                <h2 className="text-xl font-semibold text-zinc-100 mt-2 leading-snug">{post.title}</h2>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{post.description}</p>
                <span className="inline-block text-[13px] text-violet-400 mt-3">Read the post →</span>
              </Link>
            </article>
          ))}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
