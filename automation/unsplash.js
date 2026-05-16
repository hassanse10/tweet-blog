'use strict';

const CATEGORY_KEYWORDS = {
  Research:  'artificial intelligence research laboratory',
  Product:   'technology software product launch',
  Safety:    'AI safety technology ethics',
  Business:  'technology business innovation',
  Policy:    'technology regulation government',
  News:      'artificial intelligence technology',
  Other:     'artificial intelligence technology',
};

function buildQuery(headline, category) {
  // Take first 5 words of headline as keywords
  const words = headline.split(/\s+/).slice(0, 5).join(' ');
  const context = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.Other;
  return `${words} ${context}`;
}

async function fetchUnsplashImage(accessKey, headline, category) {
  if (!accessKey) return null;

  const query = encodeURIComponent(buildQuery(headline, category));
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!res.ok) {
      console.error(`  Unsplash API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    // Use "regular" size (1080px wide) — good balance of quality and load speed
    return photo.urls?.regular || photo.urls?.full || null;
  } catch (err) {
    console.error(`  Unsplash fetch failed: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchUnsplashImage };
