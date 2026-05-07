'use strict';

const Database = require('better-sqlite3');
const path = require('path');

function openDb(dbPath) {
  const resolved = dbPath || process.env.DB_PATH || path.join(__dirname, '../db/articles.db');
  const db = new Database(resolved);

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id     TEXT UNIQUE NOT NULL,
      author       TEXT NOT NULL,
      tweet_text   TEXT NOT NULL,
      tweet_url    TEXT NOT NULL,
      summary      TEXT NOT NULL,
      image_url    TEXT NOT NULL DEFAULT "",
      category     TEXT NOT NULL DEFAULT "",
      rating       INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS seen_tweets (
      author_id     TEXT PRIMARY KEY,
      last_tweet_id TEXT NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts
      USING fts5(headline, body, content='articles', content_rowid='id');
  `);

  return db;
}

function getExistingTweetIds(db) {
  return new Set(db.prepare('SELECT tweet_id FROM articles').all().map((r) => r.tweet_id));
}

function saveArticle(db, { tweetId, author, tweetText, tweetUrl, headline, body, category }) {
  const summary = `${headline}\n\n${body}`;
  const info = db.prepare(`
    INSERT OR IGNORE INTO articles (tweet_id, author, tweet_text, tweet_url, summary, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tweetId, author, tweetText, tweetUrl, summary, category || 'Other');

  if (info.changes > 0) {
    db.prepare(`
      INSERT INTO articles_fts(rowid, headline, body) VALUES (?, ?, ?)
    `).run(info.lastInsertRowid, headline, body);
    return { id: info.lastInsertRowid, headline };
  }

  return null;
}

module.exports = { openDb, getExistingTweetIds, saveArticle };
