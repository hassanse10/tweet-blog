import { openDb } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const CATEGORY_KEYWORDS = {
  Research:  'artificial intelligence research laboratory',
  Product:   'technology software product launch',
  Safety:    'AI safety technology ethics',
  Business:  'technology business innovation',
  Policy:    'technology regulation government',
  News:      'artificial intelligence technology',
  Other:     'artificial intelligence technology',
};

async function fetchUnsplashImage(accessKey, headline, category) {
  const words = (headline || '').split(/\s+/).slice(0, 5).join(' ');
  const context = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.Other;
  const query = encodeURIComponent(`${words} ${context}`);

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`,
    {
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0]?.urls?.regular || null;
}

function extractHeadline(summary) {
  return (summary || '').split('\n').find(l => l.trim()) || 'AI technology';
}

// POST /api/fetch-images — fill missing images using Unsplash
export async function POST() {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return Response.json({ ok: false, error: 'Missing UNSPLASH_ACCESS_KEY' }, { status: 500 });
  }

  try {
    const db = openDb();
    const articles = db.prepare(
      "SELECT id, summary, category FROM articles WHERE image_url = '' OR image_url IS NULL ORDER BY id DESC LIMIT 100"
    ).all();

    if (!articles.length) return Response.json({ ok: true, updated: 0, message: 'No articles need images' });

    const update = db.prepare('UPDATE articles SET image_url = ? WHERE id = ?');
    let updated = 0;

    for (const article of articles) {
      const headline = extractHeadline(article.summary);
      const imageUrl = await fetchUnsplashImage(accessKey, headline, article.category);
      if (imageUrl) {
        update.run(imageUrl, article.id);
        updated++;
      }
      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    return Response.json({ ok: true, updated, total: articles.length });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
