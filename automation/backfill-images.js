'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { openDb } = require('./db');

const CONCURRENCY = 3;
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOgImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; image-backfill/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const db = openDb();

  const articles = db.prepare(
    "SELECT id, tweet_url FROM articles WHERE image_url = '' OR image_url IS NULL ORDER BY id DESC"
  ).all();

  console.log(`Found ${articles.length} articles without images`);

  const update = db.prepare('UPDATE articles SET image_url = ? WHERE id = ?');

  let filled = 0;
  let failed = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (article) => {
      const imageUrl = await fetchOgImage(article.tweet_url);
      if (imageUrl) {
        update.run(imageUrl, article.id);
        filled++;
        console.log(`  ✓ ${article.id}: ${imageUrl.slice(0, 80)}`);
      } else {
        failed++;
        console.log(`  ✗ ${article.id}: no image (${article.tweet_url.slice(0, 60)})`);
      }
    }));

    await sleep(DELAY_MS);

    if ((i + CONCURRENCY) % 30 === 0) {
      console.log(`Progress: ${i + CONCURRENCY}/${articles.length}`);
    }
  }

  console.log(`\nDone. Filled: ${filled}, No image found: ${failed}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
