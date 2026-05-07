import { searchArticles } from '../lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://tweet-blog-production.up.railway.app';

export default function sitemap() {
  const { articles } = searchArticles({ limit: 5000 });

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    ...articles.map((a) => ({
      url: `${BASE_URL}/article/${a.id}`,
      lastModified: new Date(a.created_at),
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
