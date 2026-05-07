'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { openDb } = require('./db');
const { searchYouTube } = require('./youtube');

const BATCH = parseInt(process.env.BACKFILL_BATCH || '90', 10);
const DELAY_MS = 500; // stay within quota

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY');

  const db = openDb();

  const articles = db.prepare(`
    SELECT id, author, summary FROM articles
    WHERE youtube_video_id = ''
    ORDER BY created_at DESC
    LIMIT ?
  `).all(BATCH);

  console.log(`Backfilling ${articles.length} articles (batch of ${BATCH})...`);

  const update = db.prepare('UPDATE articles SET youtube_video_id = ? WHERE id = ?');

  let found = 0;
  for (const row of articles) {
    const headline = row.summary.split('\n').find(Boolean) || '';
    if (!headline) continue;

    const videoId = await searchYouTube(apiKey, headline, row.author);
    update.run(videoId || '', row.id);
    if (videoId) {
      found++;
      console.log(`  [${row.id}] ${headline.slice(0, 60)} → ${videoId}`);
    } else {
      console.log(`  [${row.id}] ${headline.slice(0, 60)} → no result`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`Done. Found videos for ${found}/${articles.length} articles.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
