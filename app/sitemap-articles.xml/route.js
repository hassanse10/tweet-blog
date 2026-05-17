'use strict';

import { searchArticles } from '../../lib/db';

const BASE_URL = 'https://1minai.site';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { articles } = searchArticles({ limit: 10000 });

  const urls = articles.map((a) => `
  <url>
    <loc>${BASE_URL}/article/${a.slug}</loc>
    <lastmod>${new Date(a.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  });
}
