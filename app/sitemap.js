import { searchArticles } from '../lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const CATEGORIES = ['AI', 'Research', 'Product', 'Policy', 'Other'];
const LANGS = ['de', 'es'];

export default function sitemap() {
  const { articles } = searchArticles({ limit: 5000 });

  const articleUrls = articles.flatMap((a) => [
    { url: `${BASE_URL}/article/${a.id}`, lastModified: new Date(a.created_at), changeFrequency: 'monthly', priority: 0.8 },
    ...LANGS.map((lang) => ({
      url: `${BASE_URL}/${lang}/article/${a.id}`,
      lastModified: new Date(a.created_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
  ]);

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    ...LANGS.map((lang) => ({ url: `${BASE_URL}/${lang}`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 })),
    ...CATEGORIES.map((c) => ({ url: `${BASE_URL}/topic/${c.toLowerCase()}`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 })),
    ...articleUrls,
  ];
}
