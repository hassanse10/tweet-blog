'use strict';

const BASE_URL = 'https://1minai.site';
const CATEGORIES = ['AI', 'Research', 'Product', 'Policy', 'Safety', 'Business', 'News', 'Other'];

export async function GET() {
  const now = new Date().toISOString();

  const urls = CATEGORIES.map((c) => `
  <url>
    <loc>${BASE_URL}/topic/${c.toLowerCase()}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  });
}
