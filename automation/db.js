const Database = require('better-sqlite3');
const path = require('path');

function openDb(dbPath) {
  const resolved = dbPath || process.env.DB_PATH || path.join(__dirname, '../db/articles.db');
  const db = new Database(resolved);
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id    TEXT UNIQUE NOT NULL,
      author      TEXT NOT NULL,
      tweet_text  TEXT NOT NULL,
      tweet_url   TEXT NOT NULL,
      summary     TEXT NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS seen_tweets (
      author_id      TEXT PRIMARY KEY,
      last_tweet_id  TEXT NOT NULL
    );
  `);
  return db;
}

function getLastSeenId(db, authorId) {
  const row = db.prepare('SELECT last_tweet_id FROM seen_tweets WHERE author_id = ?').get(authorId);
  return row ? row.last_tweet_id : null;
}

function saveArticle(db, { tweetId, author, tweetText, tweetUrl, summary }) {
  db.prepare(`
    INSERT OR IGNORE INTO articles (tweet_id, author, tweet_text, tweet_url, summary)
    VALUES (?, ?, ?, ?, ?)
  `).run(tweetId, author, tweetText, tweetUrl, summary);
}

function updateSeenTweet(db, authorId, tweetId) {
  db.prepare(`
    INSERT INTO seen_tweets (author_id, last_tweet_id)
    VALUES (?, ?)
    ON CONFLICT(author_id) DO UPDATE SET last_tweet_id = excluded.last_tweet_id
  `).run(authorId, tweetId);
}

module.exports = { openDb, getLastSeenId, saveArticle, updateSeenTweet };
