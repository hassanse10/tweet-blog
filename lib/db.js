'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'db/articles.db');

const ARTICLE_COLS = 'id, author, tweet_text, tweet_url, summary, image_url, category, rating, created_at, sections, faqs, youtube_video_id';

let _db = null;
function openDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  try { _db.exec("ALTER TABLE articles ADD COLUMN sections TEXT NOT NULL DEFAULT '[]'"); } catch {}
  try { _db.exec("ALTER TABLE articles ADD COLUMN faqs TEXT NOT NULL DEFAULT '[]'"); } catch {}
  try { _db.exec("ALTER TABLE articles ADD COLUMN youtube_video_id TEXT NOT NULL DEFAULT ''"); } catch {}
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

  return { articles: articles.map(parseArticle), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

function getArticleById(id) {
  const db = openDb();
  return parseArticle(db.prepare(`SELECT ${ARTICLE_COLS} FROM articles WHERE id = ?`).get(id));
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

module.exports = { searchArticles, getArticleById, getRelatedArticles, getNextArticle, getCategories, getDistinctSources, rateArticle };
