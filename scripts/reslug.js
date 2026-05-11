'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../db/articles.db'));

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

const articles = db.prepare('SELECT id, summary FROM articles ORDER BY id ASC').all();
const update = db.prepare('UPDATE articles SET slug = ? WHERE id = ?');

const seen = new Map(); // slug -> count

db.transaction(() => {
  for (const row of articles) {
    const headline = (row.summary || '').split('\n').find(Boolean) || '';
    const base = slugify(headline);
    const count = seen.get(base) || 0;
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    seen.set(base, count + 1);
    update.run(slug, row.id);
  }
})();

console.log(`Updated ${articles.length} articles`);

const sample = db.prepare('SELECT id, slug FROM articles ORDER BY id DESC LIMIT 10').all();
sample.forEach(r => console.log(r.id, '|', r.slug));
