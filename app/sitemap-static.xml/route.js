'use strict';

const BASE_URL = 'https://1minai.site';
const STATIC = [
  { path: '/about',   priority: '0.5' },
  { path: '/contact', priority: '0.5' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms',   priority: '0.3' },
];

export async function GET() {
  const now = new Date().toISOString();

  const urls = STATIC.map(({ path, priority }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
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
