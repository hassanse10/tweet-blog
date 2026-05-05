const { openDb, getLastSeenId, saveArticle, updateSeenTweet } = require('../db');

let db;

beforeEach(() => {
  db = openDb(':memory:');
});

afterEach(() => {
  db.close();
});

test('getLastSeenId returns null for unknown author', () => {
  expect(getLastSeenId(db, 'u1')).toBeNull();
});

test('updateSeenTweet and getLastSeenId round-trip', () => {
  updateSeenTweet(db, 'u1', '999');
  expect(getLastSeenId(db, 'u1')).toBe('999');
});

test('updateSeenTweet overwrites older id', () => {
  updateSeenTweet(db, 'u1', '100');
  updateSeenTweet(db, 'u1', '200');
  expect(getLastSeenId(db, 'u1')).toBe('200');
});

test('saveArticle inserts a row', () => {
  saveArticle(db, {
    tweetId: 'abc',
    author: 'OpenAI',
    tweetText: 'hello',
    tweetUrl: 'https://twitter.com/OpenAI/status/abc',
    summary: 'GPT-5 Is Here\n\nOpenAI launched something big.'
  });
  const row = db.prepare('SELECT * FROM articles WHERE tweet_id = ?').get('abc');
  expect(row.author).toBe('OpenAI');
  expect(row.summary).toContain('GPT-5');
});

test('saveArticle ignores duplicate tweet_id', () => {
  const article = { tweetId: 'dup', author: 'OpenAI', tweetText: 'x', tweetUrl: 'u', summary: 's' };
  saveArticle(db, article);
  saveArticle(db, article);
  const rows = db.prepare('SELECT * FROM articles WHERE tweet_id = ?').all('dup');
  expect(rows).toHaveLength(1);
});
