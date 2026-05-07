'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { openDb, saveTranslation } = require('./db');
const { translateArticle } = require('./translate');

const LANGS = ['de', 'es'];
const BATCH = parseInt(process.env.BACKFILL_BATCH || '50', 10);
const DELAY_MS = 300;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('Missing DEEPL_API_KEY');

  const db = openDb();

  const forceRedo = process.env.FORCE_REDO === '1';

  // Find articles missing translations — or all articles if FORCE_REDO=1
  const articles = db.prepare(
    forceRedo
      ? `SELECT id, summary, sections, faqs FROM articles ORDER BY created_at DESC LIMIT ?`
      : `SELECT a.id, a.summary, a.sections, a.faqs FROM articles a
         WHERE NOT EXISTS (
           SELECT 1 FROM article_translations t
           WHERE t.article_id = a.id AND t.lang = 'de'
         )
         ORDER BY a.created_at DESC LIMIT ?`
  ).all(BATCH);

  if (forceRedo) console.log('FORCE_REDO mode — overwriting existing translations');

  console.log(`Backfilling translations for ${articles.length} articles...`);

  let done = 0;
  for (const row of articles) {
    const headline = row.summary.split('\n').find(Boolean) || '';
    if (!headline) continue;

    let sections = [];
    let faqs = [];
    try { sections = JSON.parse(row.sections || '[]'); } catch {}
    try { faqs = JSON.parse(row.faqs || '[]'); } catch {}

    for (const lang of LANGS) {
      try {
        const translated = await translateArticle(apiKey, { headline, sections, faqs }, lang);
        saveTranslation(db, row.id, lang, translated);
      } catch (err) {
        console.error(`  [${row.id}] ${lang} failed: ${err.message}`);
      }
    }

    done++;
    console.log(`  [${row.id}] ${headline.slice(0, 55)}… ✓`);
    await sleep(DELAY_MS);
  }

  console.log(`Done. Translated ${done} articles.`);
}

run().catch((err) => { console.error(err); process.exit(1); });
