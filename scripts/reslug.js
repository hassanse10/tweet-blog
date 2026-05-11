'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../db/articles.db');
const db = new Database(DB_PATH);

function slugify(text) {
  let base = (text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (base.length > 70) {
    const cut = base.slice(0, 70);
    const lastHyphen = cut.lastIndexOf('-');
    base = lastHyphen > 20 ? cut.slice(0, lastHyphen) : cut;
  }
  return base.replace(/-+$/, '') || 'article';
}

try { db.exec("CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)"); } catch {}

const slugVersion = db.prepare("SELECT value FROM _meta WHERE key = 'slug_version'").get()?.value;

if (slugVersion === '2') {
  console.log('[reslug] slugs already up to date, skipping');
  process.exit(0);
}

console.log('[reslug] migrating slugs...');
const articles = db.prepare('SELECT id, summary FROM articles').all();
const update = db.prepare('UPDATE articles SET slug = ? WHERE id = ?');
const seen = new Map();

db.transaction(() => {
  for (const row of articles) {
    const headline = (row.summary || '').split('\n').find(Boolean) || '';
    const base = slugify(headline);
    const count = seen.get(base) || 0;
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    seen.set(base, count + 1);
    update.run(slug, row.id);
  }
  db.prepare("INSERT OR REPLACE INTO _meta VALUES ('slug_version', '2')").run();
})();

console.log(`[reslug] done — ${articles.length} articles updated`);
