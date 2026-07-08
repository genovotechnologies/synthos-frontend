/**
 * Changelog content, statically compiled. Terse, dated entries with stable
 * anchors (the anchor doubles as the linkable id on /changelog#<anchor>).
 */

export interface ChangelogEntry {
  date: string; // ISO yyyy-mm-dd
  title: string;
  anchor: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-07-08',
    title: 'Renameable validations, Paddle billing, Python SDK',
    anchor: '2026-07-08-rename-billing-sdk',
    items: [
      'Validations can now be renamed inline from the list and report views.',
      'Credit purchases run through Paddle checkout with hosted receipts on each transaction.',
      'Python SDK released: pip install synthos — validate datasets from any pipeline.',
      'Admin: growth analytics (signups, validations, revenue) and a "view as user" support tool.',
    ],
  },
  {
    date: '2026-07-08',
    title: 'Feature wave: claims, groups, findings, 2FA',
    anchor: '2026-07-08-feature-wave',
    items: [
      'Warranty claims can be filed directly from the dashboard.',
      'Folder uploads can be grouped and validated together (runs on the group’s largest ready file).',
      'Row-level findings on validation reports, sampled from CSV/TSV/JSONL data.',
      'Dataset detail pages with schema explorer, named API keys, optional two-factor authentication.',
      'Public certificate verification at /verify/<certificate-id> (certificates valid 90 days from completion).',
    ],
  },
  {
    date: '2026-07-07',
    title: 'Multimodal uploads and bot protection',
    anchor: '2026-07-07-multimodal-uploads',
    items: [
      'Uploads accept text, image, audio, video, embedding arrays, and packed archives alongside tabular formats.',
      'Multi-file and whole-folder uploads with per-file progress.',
      'Registration hardened with Cloudflare Turnstile and per-IP rate limits.',
    ],
  },
];
