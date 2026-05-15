'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'db/articles.db');

const ARTICLE_COLS = 'id, author, tweet_text, tweet_url, summary, image_url, category, rating, created_at, sections, faqs, youtube_video_id, slug';

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

let _db = null;
function openDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  try { _db.exec("ALTER TABLE articles ADD COLUMN sections TEXT NOT NULL DEFAULT '[]'"); } catch {}
  try { _db.exec("ALTER TABLE articles ADD COLUMN faqs TEXT NOT NULL DEFAULT '[]'"); } catch {}
  try { _db.exec("ALTER TABLE articles ADD COLUMN youtube_video_id TEXT NOT NULL DEFAULT ''"); } catch {}
  try { _db.exec("ALTER TABLE articles ADD COLUMN slug TEXT NOT NULL DEFAULT ''"); } catch {}

  // Migration version tracking
  try { _db.exec("CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)"); } catch {}

  const slugVersion = _db.prepare("SELECT value FROM _meta WHERE key = 'slug_version'").get()?.value;

  // v2: regenerate all slugs without trailing numeric IDs (runs once on first start)
  if (slugVersion !== '2') {
    const articles = _db.prepare('SELECT id, summary FROM articles').all();
    const update = _db.prepare('UPDATE articles SET slug = ? WHERE id = ?');
    const seen = new Map();
    _db.transaction(() => {
      for (const row of articles) {
        const headline = (row.summary || '').split('\n').find(Boolean) || '';
        const base = slugify(headline);
        const count = seen.get(base) || 0;
        const slug = count === 0 ? base : `${base}-${count + 1}`;
        seen.set(base, count + 1);
        update.run(slug, row.id);
      }
      _db.prepare("INSERT OR REPLACE INTO _meta VALUES ('slug_version', '2')").run();
    })();
  }

  // Always: backfill any articles with NULL or empty slug (e.g. inserted by n8n after v2 migration)
  const unslugged = _db.prepare("SELECT id, summary FROM articles WHERE slug IS NULL OR slug = ''").all();
  if (unslugged.length > 0) {
    const existingSet = new Set(
      _db.prepare("SELECT slug FROM articles WHERE slug IS NOT NULL AND slug != ''").all().map((r) => r.slug)
    );
    const upd = _db.prepare('UPDATE articles SET slug = ? WHERE id = ?');
    _db.transaction(() => {
      for (const row of unslugged) {
        const headline = (row.summary || '').split('\n').find(Boolean) || '';
        const base = slugify(headline);
        let slug = base;
        let n = 2;
        while (existingSet.has(slug)) slug = `${base}-${n++}`;
        existingSet.add(slug);
        upd.run(slug, row.id);
      }
    })();
  }

  // Kick off OG image backfill asynchronously — non-blocking
  setImmediate(() => {
    const { backfillOgImages } = require('./og');
    backfillOgImages(_db).catch(() => {});
  });

  return _db;
}

function parseArticle(row) {
  if (!row) return row;
  try { row.sections = JSON.parse(row.sections); } catch { row.sections = []; }
  try { row.faqs    = JSON.parse(row.faqs);    } catch { row.faqs    = []; }
  return row;
}

function searchArticles({ q, source, category, page = 1, limit = 20 } = {}) {
  const db = openDb();
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (source) { conditions.push('author = ?'); params.push(source); }
  if (category) { conditions.push('category = ?'); params.push(category); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let articles, total;

  if (q && q.trim()) {
    const ftsConditions = [...conditions];
    const ftsParams = [...params];

    try {
      articles = db.prepare(`
        SELECT a.${ARTICLE_COLS}
        FROM articles a
        INNER JOIN articles_fts f ON f.rowid = a.id
        WHERE f MATCH ?
          ${ftsConditions.length ? 'AND ' + ftsConditions.map(c => 'a.' + c).join(' AND ') : ''}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(q, ...ftsParams, limit, offset);

      total = db.prepare(`
        SELECT COUNT(*) AS n
        FROM articles a
        INNER JOIN articles_fts f ON f.rowid = a.id
        WHERE f MATCH ?
          ${ftsConditions.length ? 'AND ' + ftsConditions.map(c => 'a.' + c).join(' AND ') : ''}
      `).get(q, ...ftsParams)?.n ?? 0;
    } catch {
      articles = [];
      total = 0;
    }
  } else {
    articles = db.prepare(`
      SELECT ${ARTICLE_COLS} FROM articles ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    total = db.prepare(`
      SELECT COUNT(*) AS n FROM articles ${where}
    `).get(...params)?.n ?? 0;
  }

  const result = articles.map(parseArticle);

  // Lazy backfill: generate slugs for articles inserted by n8n without one
  const needsSlug = result.filter((a) => !a.slug);
  if (needsSlug.length > 0) {
    const existingSet = new Set(
      db.prepare("SELECT slug FROM articles WHERE slug IS NOT NULL AND slug != ''").all().map((r) => r.slug)
    );
    const upd = db.prepare('UPDATE articles SET slug = ? WHERE id = ?');
    db.transaction(() => {
      for (const a of needsSlug) {
        const headline = (a.summary || '').split('\n').find(Boolean) || '';
        const base = slugify(headline);
        let slug = base;
        let n = 2;
        while (existingSet.has(slug)) slug = `${base}-${n++}`;
        existingSet.add(slug);
        upd.run(slug, a.id);
        a.slug = slug;
      }
    })();
  }

  return { articles: result, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

function getArticleById(id) {
  const db = openDb();
  const row = parseArticle(db.prepare(`SELECT ${ARTICLE_COLS} FROM articles WHERE id = ?`).get(id));
  if (row && !row.slug) {
    const headline = (row.summary || '').split('\n').find(Boolean) || '';
    const base = slugify(headline);
    const existingSet = new Set(
      db.prepare("SELECT slug FROM articles WHERE slug != '' AND id != ?").all(id).map((r) => r.slug)
    );
    let slug = base;
    let n = 2;
    while (existingSet.has(slug)) slug = `${base}-${n++}`;
    db.prepare('UPDATE articles SET slug = ? WHERE id = ?').run(slug, id);
    row.slug = slug;
  }
  return row;
}

function getArticleBySlug(slug) {
  const db = openDb();

  // 1. Exact match
  let row = db.prepare(`SELECT ${ARTICLE_COLS} FROM articles WHERE slug = ?`).get(slug);
  if (row) return parseArticle(row);

  // 2. URL slug ends with numeric ID (old format: title-123) → look up by ID
  const match = slug.match(/-(\d+)$/);
  if (match) {
    row = db.prepare(`SELECT ${ARTICLE_COLS} FROM articles WHERE id = ?`).get(Number(match[1]));
    if (row) return parseArticle(row);
  }

  // 3. Find by regenerating headline slug — covers:
  //    a) articles with slug='' (n8n-inserted, lazy backfill not yet run)
  //    b) old ID-suffix slugs (title-1077) when URL has the clean version (title)
  //    c) old mid-word truncation mismatches
  const candidates = db.prepare(
    `SELECT id, summary FROM articles WHERE slug IS NULL OR slug = '' OR slug LIKE ? ORDER BY id DESC LIMIT 300`
  ).all(`${slug}%`);
  for (const candidate of candidates) {
    const headline = (candidate.summary || '').split('\n').find(Boolean) || '';
    if (slugify(headline) !== slug) continue;
    // Exact match (step 1) already failed, so this slug is unclaimed — assign it
    const fullRow = db.prepare(`SELECT ${ARTICLE_COLS} FROM articles WHERE id = ?`).get(candidate.id);
    db.prepare('UPDATE articles SET slug = ? WHERE id = ?').run(slug, candidate.id);
    fullRow.slug = slug;
    return parseArticle(fullRow);
  }

  return null;
}

function getRelatedArticles(id, category, limit = 3) {
  const db = openDb();
  return db.prepare(`
    SELECT ${ARTICLE_COLS} FROM articles
    WHERE category = ? AND id != ?
    ORDER BY created_at DESC LIMIT ?
  `).all(category, id, limit).map(parseArticle);
}

function getNextArticle(category, excludeIds = []) {
  const db = openDb();
  const safeExclude = excludeIds.slice(0, 50);
  if (!safeExclude.length) {
    return parseArticle(db.prepare(`
      SELECT ${ARTICLE_COLS} FROM articles
      WHERE category = ? ORDER BY created_at DESC LIMIT 1
    `).get(category)) || null;
  }
  const placeholders = safeExclude.map(() => '?').join(',');
  return parseArticle(db.prepare(`
    SELECT ${ARTICLE_COLS} FROM articles
    WHERE category = ? AND id NOT IN (${placeholders})
    ORDER BY created_at DESC LIMIT 1
  `).get(category, ...safeExclude)) || null;
}

function getCategories() {
  const db = openDb();
  return db.prepare(`
    SELECT category, COUNT(*) as count FROM articles
    WHERE category != '' GROUP BY category ORDER BY count DESC
  `).all();
}

function getDistinctSources() {
  const db = openDb();
  return db.prepare('SELECT DISTINCT author FROM articles ORDER BY author').all().map((r) => r.author);
}

function rateArticle(id, delta) {
  const db = openDb();
  const info = db.prepare('UPDATE articles SET rating = rating + ? WHERE id = ?').run(delta, id);
  if (info.changes === 0) return null;
  return db.prepare('SELECT rating FROM articles WHERE id = ?').get(id)?.rating ?? 0;
}

module.exports = { openDb, searchArticles, getArticleById, getArticleBySlug, getRelatedArticles, getNextArticle, getCategories, getDistinctSources, rateArticle };
