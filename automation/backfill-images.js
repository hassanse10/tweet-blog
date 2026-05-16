'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { openDb } = require('./db');
const { fetchUnsplashImage } = require('./unsplash');

const CONCURRENCY = 3;
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractHeadline(summary) {
  return (summary || '').split('\n').find((l) => l.trim()) || 'AI technology';
}

async function run() {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error('Missing UNSPLASH_ACCESS_KEY in .env');
    process.exit(1);
  }

  const db = openDb();

  const articles = db.prepare(
    "SELECT id, summary, category FROM articles WHERE image_url = '' OR image_url IS NULL ORDER BY id DESC"
  ).all();

  console.log(`Found ${articles.length} articles without images`);
  if (!articles.length) return;

  const update = db.prepare('UPDATE articles SET image_url = ? WHERE id = ?');
  let filled = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (article) => {
      const headline = extractHeadline(article.summary);
      const imageUrl = await fetchUnsplashImage(accessKey, headline, article.category);

      if (imageUrl) {
        update.run(imageUrl, article.id);
        filled++;
        console.log(`  ✓ [${article.id}] ${headline.slice(0, 60)}`);
      } else {
        failed++;
        console.log(`  ✗ [${article.id}] no image returned`);
      }
    }));

    await sleep(DELAY_MS);

    if ((i + CONCURRENCY) % 30 === 0) {
      console.log(`Progress: ${Math.min(i + CONCURRENCY, articles.length)}/${articles.length}`);
    }
  }

  console.log(`\nDone. Filled: ${filled}, Failed: ${failed}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
