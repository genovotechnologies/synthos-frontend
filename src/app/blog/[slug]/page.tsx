import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, getPost } from '@/content/blog';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { SiteFooter } from '@/components/marketing/site-footer';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `https://synthos.dev/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T00:00:00Z`,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: `${post.date}T00:00:00Z`,
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: post.authorRole,
      worksFor: { '@type': 'Organization', name: 'Genovo Technologies', url: 'https://genovotech.com' },
    },
    publisher: { '@type': 'Organization', name: 'Genovo Technologies', url: 'https://genovotech.com' },
    mainEntityOfPage: `https://synthos.dev/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://synthos.dev' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://synthos.dev/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://synthos.dev/blog/${post.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <MarketingNav />

      <article className="container mx-auto px-4 flex-1 w-full max-w-2xl pb-20">
        <header className="py-14 border-b border-white/[0.06]">
          <Link href="/blog" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors">
            ← All posts
          </Link>
          <h1 className="text-3xl sm:text-[2.6rem] font-semibold tracking-tight leading-tight mt-5">
            {post.title}
          </h1>
          <p className="text-[13px] text-zinc-600 mt-5 tabular-nums">
            {formatDate(post.date)} · {post.readingMinutes} min read
          </p>
          <p className="text-[13px] text-zinc-500 mt-2">
            By <span className="text-zinc-300">{post.author}</span>, {post.authorRole} at Genovo Technologies
          </p>
        </header>

        <div className="pt-10 space-y-10">
          {post.sections.map((section, index) => (
            <section key={index}>
              {section.heading && (
                <h2 className="text-xl font-semibold text-zinc-100 tracking-tight mb-4">{section.heading}</h2>
              )}
              <div className="space-y-4">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-[1.75] text-zinc-400">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-4 space-y-2.5">
                  {section.list.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-zinc-400">
                      <span className="mt-[0.65em] w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="mt-14 p-6 rounded-2xl bg-violet-500/[0.06] ring-1 ring-violet-500/15">
          <p className="text-sm font-medium text-zinc-100">Validate your next training dataset</p>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
            Score any corpus for collapse risk before it reaches your training pipeline. First report in 48 hours.
          </p>
          <Link
            href="/register"
            className="inline-block mt-4 px-4 py-2 rounded-full text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            Get started free
          </Link>
        </aside>
      </article>

      <SiteFooter />
    </main>
  );
}
