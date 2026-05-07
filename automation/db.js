'use strict';

const Database = require('better-sqlite3');
const path = require('path');

function openDb(dbPath) {
  const resolved = dbPath || process.env.DB_PATH || path.join(__dirname, '../db/articles.db');
  const db = new Database(resolved);

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id         TEXT UNIQUE NOT NULL,
      author           TEXT NOT NULL,
      tweet_text       TEXT NOT NULL,
      tweet_url        TEXT NOT NULL,
      summary          TEXT NOT NULL,
      image_url        TEXT NOT NULL DEFAULT "",
      category         TEXT NOT NULL DEFAULT "",
      rating           INTEGER NOT NULL DEFAULT 0,
      failed_count     INTEGER NOT NULL DEFAULT 0,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS seen_tweets (
      author_id     TEXT PRIMARY KEY,
      last_tweet_id TEXT NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts
      USING fts5(headline, body, content='articles', content_rowid='id');
  `);

  // Migrate: add new columns if missing
  const cols = db.prepare('PRAGMA table_info(articles)').all().map((c) => c.name);
  if (!cols.includes('sections'))         db.exec("ALTER TABLE articles ADD COLUMN sections TEXT NOT NULL DEFAULT '[]'");
  if (!cols.includes('faqs'))             db.exec("ALTER TABLE articles ADD COLUMN faqs TEXT NOT NULL DEFAULT '[]'");
  if (!cols.includes('youtube_video_id')) db.exec("ALTER TABLE articles ADD COLUMN youtube_video_id TEXT NOT NULL DEFAULT ''");

  return db;
}

function getExistingTweetIds(db) {
  return new Set(db.prepare('SELECT tweet_id FROM articles').all().map((r) => r.tweet_id));
}

function saveArticle(db, { tweetId, author, tweetText, tweetUrl, headline, sections, faqs, category, youtubeVideoId }) {
  const body = (sections || []).map((s) => s.body).join('\n\n');
  const summary = `${headline}\n\n${body}`;

  const info = db.prepare(`
    INSERT OR IGNORE INTO articles
      (tweet_id, author, tweet_text, tweet_url, summary, category, sections, faqs, youtube_video_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tweetId, author, tweetText, tweetUrl, summary,
    category || 'Other',
    JSON.stringify(sections || []),
    JSON.stringify(faqs || []),
    youtubeVideoId || '',
  );

  if (info.changes > 0) {
    db.prepare(`
      INSERT INTO articles_fts(rowid, headline, body) VALUES (?, ?, ?)
    `).run(info.lastInsertRowid, headline, body);
    return { id: info.lastInsertRowid, headline };
  }

  return null;
}

module.exports = { openDb, getExistingTweetIds, saveArticle };
