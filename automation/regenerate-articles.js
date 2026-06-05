'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { openDb } = require('./db');
const { generateArticle } = require('./openrouter');

const LIMIT = parseInt(process.env.LIMIT || '10', 10);

async function run() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const db = openDb();

  const articles = db.prepare(
    'SELECT id, author, tweet_text, tweet_url, summary FROM articles ORDER BY id ASC LIMIT ?'
  ).all(LIMIT);

  console.log(`Regenerating ${articles.length} articles...`);

  const updateStmt = db.prepare(`
    UPDATE articles SET summary = ?, sections = ?, faqs = ?, category = ? WHERE id = ?
  `);

  let updated = 0;
  let failed = 0;

  for (const row of articles) {
    const existingHeadline = (row.summary || '').split('\n').find(Boolean) || '';
    try {
      console.log(`  [${row.id}] "${existingHeadline.slice(0, 60)}..."`);

      const article = await generateArticle(apiKey, {
        author: row.author,
        title: existingHeadline,
        text: row.tweet_text,
        url: row.tweet_url,
      });

      const body = article.sections.map((s) => s.body).join('\n\n');
      const summary = `${article.headline}\n\n${body}`;

      updateStmt.run(
        summary,
        JSON.stringify(article.sections),
        JSON.stringify(article.faqs),
        article.category,
        row.id
      );

      console.log(`  ✓ Updated [${row.id}] → "${article.headline}"`);
      updated++;

      // Avoid rate limit
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ✗ Failed [${row.id}]: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated} | Failed: ${failed}`);
  db.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
