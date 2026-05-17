'use strict';

import { searchArticles } from '../../lib/db';

const BASE_URL = 'https://1minai.site';

function escapeXml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { articles } = searchArticles({ limit: 50 });

  const items = articles.map((a) => {
    const lines = (a.summary || '').split('\n').filter(Boolean);
    const headline = escapeXml(lines[0] || 'AI Update');
    const description = escapeXml(lines.slice(1).join(' ').slice(0, 300));
    const url = `${BASE_URL}/article/${a.slug}`;
    const pubDate = new Date(a.created_at).toUTCString();
    const category = escapeXml(a.category || 'AI');
    const author = escapeXml(a.author || '1minAi');

    return `
    <item>
      <title>${headline}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${category}</category>
      <author>noreply@1minai.site (${author})</author>
      ${a.image_url ? `<enclosure url="${escapeXml(a.image_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>1minAi — AI News in 1 Minute</title>
    <link>${BASE_URL}</link>
    <description>Breaking AI news from OpenAI, Anthropic, Google DeepMind and more — summarized in 1 minute.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/icon-192.png</url>
      <title>1minAi</title>
      <link>${BASE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  });
}
