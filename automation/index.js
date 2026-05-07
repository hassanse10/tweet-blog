'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { fetchItems } = require('./rss');
const { generateArticle } = require('./openrouter');
const { openDb, getExistingTweetIds, saveArticle } = require('./db');
const { sendNotifications } = require('./notify');

async function run() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const db = openDb();
  const existing = getExistingTweetIds(db);

  console.log('Fetching RSS feeds...');
  const items = await fetchItems();
  const newItems = items.filter((i) => !existing.has(i.id));
  console.log(`${items.length} fetched, ${newItems.length} new`);

  const saved = [];
  for (const item of newItems) {
    try {
      console.log(`  Generating: "${item.title}" (${item.author})`);
      const article = await generateArticle(apiKey, item);
      const result = saveArticle(db, {
        tweetId: item.id,
        author: item.author,
        tweetText: item.text,
        tweetUrl: item.url,
        headline: article.headline,
        body: article.body,
        category: article.category,
      });
      if (result) {
        saved.push({ id: result.id, author: item.author, headline: article.headline });
      }
    } catch (err) {
      console.error(`  Failed "${item.title}": ${err.message}`);
    }
  }

  console.log(`Saved ${saved.length} new articles`);
  await sendNotifications(saved);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
