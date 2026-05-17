import { searchArticles } from '../lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const CATEGORIES = ['AI', 'Research', 'Product', 'Policy', 'Safety', 'Business', 'News', 'Other'];

const STATIC_PAGES = [
  { path: '/about',   priority: 0.5 },
  { path: '/contact', priority: 0.5 },
  { path: '/privacy', priority: 0.3 },
  { path: '/terms',   priority: 0.3 },
];

export default function sitemap() {
  const { articles } = searchArticles({ limit: 5000 });

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    ...CATEGORIES.map((c) => ({
      url: `${BASE_URL}/topic/${c.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    })),
    ...STATIC_PAGES.map(({ path, priority }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority,
    })),
    ...articles.map((a) => ({
      url: `${BASE_URL}/article/${a.slug}`,
      lastModified: new Date(a.created_at),
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
