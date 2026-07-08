/**
 * Blog content, statically compiled — no CMS. Add a post by appending to the
 * array; the index, detail pages, sitemap, and RSS feed all derive from it.
 */

export interface BlogSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  author: string;
  keywords: string[];
  readingMinutes: number;
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'model-collapse-silent-killer-ai-training',
    title: 'Model Collapse: The Silent Killer of AI Training Runs',
    description:
      'Model collapse quietly degrades models trained on synthetic or recursively generated data. Here is how it happens, how to detect it before training, and why AI training data quality is now a pre-training problem.',
    date: '2026-07-08',
    author: 'Synthos Team',
    keywords: [
      'model collapse',
      'synthetic data validation',
      'AI training data quality',
      'training data validation',
      'collapse detection',
    ],
    readingMinutes: 6,
    sections: [
      {
        paragraphs: [
          'Every large training run makes a bet: that the data going in can support the model coming out. As synthetic and augmented data become a majority share of training corpora, that bet is failing more often — and failing silently. The failure mode has a name: model collapse.',
          'Model collapse is the progressive degradation that occurs when models learn from data that other models generated. Distributions narrow, tails disappear, and rare-but-important patterns get averaged away. The loss curve looks fine. The eval suite may even look fine. Then the deployed model turns out to have quietly forgotten the edges of reality.',
        ],
      },
      {
        heading: 'Why collapse is hard to see before it costs you',
        paragraphs: [
          'Collapse is not a bug you can catch in a code review. It lives in the statistics of your dataset: distribution fidelity that drifts a few percent per generation, feature correlations that tighten unnaturally, temporal patterns that smooth out, outliers that vanish. Each signal is small; together they compound into a model that generalizes worse with every training cycle.',
          'The expensive part is when you find out. Teams typically discover collapse after a training run — after the compute spend, after the eval regression, sometimes after the customer complaint. At billion-parameter scale that is a seven- or eight-figure mistake caused by data that was broken before the first GPU spun up.',
        ],
      },
      {
        heading: 'Validating training data before you train',
        paragraphs: [
          'The fix is to treat AI training data quality as a pre-training gate, the way tests gate a deploy. Before a corpus reaches your training pipeline, it should be scored for collapse risk across the dimensions where collapse actually shows up:',
        ],
        list: [
          'Distribution fidelity — does the synthetic data cover the same space as real data, including the tails?',
          'Feature correlation — are relationships between variables preserved, or artificially tightened?',
          'Temporal consistency — do time-dependent patterns survive generation?',
          'Outlier structure — are rare events still represented, or averaged away?',
          'Schema compliance — does every shard still mean what the training code thinks it means?',
        ],
      },
      {
        heading: 'How Synthos does it',
        paragraphs: [
          'Synthos validates training datasets — synthetic, augmented, or collected — by training cascades of small proxy models and extrapolating scaling behavior, instead of waiting for the full-size run to fail. A validation returns a risk score, per-dimension breakdowns, row-level findings from sampled data, and concrete fix recommendations, typically within 48 hours.',
          'Low-risk datasets can be certified — with a verifiable certificate and, on qualifying validations, a financial performance warranty. The goal is simple: no team should discover a data problem from a failed training run again.',
        ],
      },
      {
        heading: 'Where to start',
        paragraphs: [
          'If your pipeline touches synthetic data, start by validating your next corpus before it trains anything. Upload a dataset, run a standard validation, and read the dimension scores — most teams find at least one surprise in their first report. The account is free to create, and the API makes validation a one-line step in an existing pipeline.',
        ],
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
