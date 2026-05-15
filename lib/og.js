'use strict';

const https = require('https');
const http  = require('http');

// Fetch a URL following redirects, returns the HTML (first 80KB — enough for <head>)
function get(url, redirects = 6) {
  return new Promise((resolve, reject) => {
    if (!url || redirects === 0) return reject(new Error('too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIDigest/1.0; +https://1minai.site)',
        Accept: 'text/html',
      },
      timeout: 10000,
    }, (res) => {
      // follow redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : (() => { try { return new URL(res.headers.location, url).href; } catch { return null; } })();
        return next ? get(next, redirects - 1).then(resolve).catch(reject) : reject(new Error('bad redirect'));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }

      const chunks = [];
      let bytes = 0;
      res.on('data', (chunk) => {
        chunks.push(chunk);
        bytes += chunk.length;
        if (bytes > 80_000) req.destroy(); // stop after 80KB
      });
      res.on('end',  () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Extract og:image or twitter:image from HTML, return absolute URL
function extractOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]*property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/i,
    /<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (!m?.[1]) continue;
    const raw = m[1].trim();
    if (!raw) continue;
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('//'))   return 'https:' + raw;
    if (raw.startsWith('/') && baseUrl) {
      try {
        const b = new URL(baseUrl);
        return `${b.protocol}//${b.host}${raw}`;
      } catch {}
    }
  }
  return null;
}

// Choose the URL to fetch from — tweet_url is already the article URL in this app
function resolveSourceUrl(article) {
  const { tweet_url, tweet_text } = article;

  // If tweet_url is a direct article URL (not Twitter), use it
  if (tweet_url && !/^https?:\/\/(twitter\.com|x\.com)\//i.test(tweet_url)) {
    return tweet_url;
  }

  // Fall back: find first non-Twitter URL in tweet_text
  const urls = (tweet_text || '').match(/https?:\/\/[^\s"']+/g) || [];
  return urls.find((u) => !/^https?:\/\/(twitter\.com|x\.com)\//i.test(u)) || null;
}

// Backfill og:image for articles that have no image_url yet
async function backfillOgImages(db) {
  const rows = db.prepare(`
    SELECT id, tweet_url, tweet_text
    FROM   articles
    WHERE  (image_url IS NULL OR image_url = '')
    ORDER  BY id DESC
    LIMIT  200
  `).all();

  if (!rows.length) return;

  console.log(`[og] Fetching images for ${rows.length} articles…`);
  const upd = db.prepare('UPDATE articles SET image_url = ? WHERE id = ?');
  let updated = 0;

  for (const row of rows) {
    const url = resolveSourceUrl(row);
    if (!url) continue;

    try {
      const html    = await get(url);
      const imgUrl  = extractOgImage(html, url);
      if (imgUrl) {
        upd.run(imgUrl, row.id);
        updated++;
      }
    } catch {
      // skip silently — network errors, paywalls, etc.
    }

    // Polite delay: 300 ms between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[og] Done — updated ${updated} / ${rows.length} articles.`);
}

module.exports = { backfillOgImages };
