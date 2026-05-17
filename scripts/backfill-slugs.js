'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'db/articles.db');

function slugify(text, id) {
  const base = (text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)
    .replace(/-+$/, '');
  return (base || 'article') + '-' + id;
}

const db = new Database(DB_PATH);

try { db.exec("ALTER TABLE articles ADD COLUMN slug TEXT NOT NULL DEFAULT ''"); } catch {}

const rows = db.prepare("SELECT id, summary FROM articles WHERE slug = ''").all();

if (!rows.length) {
  console.log('All articles already have slugs.');
  process.exit(0);
}

console.log(`Backfilling ${rows.length} articles...`);

const update = db.prepare('UPDATE articles SET slug = ? WHERE id = ?');
db.transaction(() => {
  for (const row of rows) {
    const headline = (row.summary || '').split('\n').find(Boolean) || '';
    const slug = slugify(headline, row.id);
    update.run(slug, row.id);
  }
})();

console.log(`Done. ${rows.length} articles updated.`);
