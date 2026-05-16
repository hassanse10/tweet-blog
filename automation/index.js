'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { fetchItems } = require('./rss');
const { generateArticle } = require('./openrouter');
const { openDb, getExistingTweetIds, saveArticle } = require('./db');
const { sendNotifications } = require('./notify');
const { searchYouTube } = require('./youtube');
const { fetchUnsplashImage } = require('./unsplash');

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
      const timeout = (ms) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
      );

      const article = await Promise.race([generateArticle(apiKey, item), timeout(30000)]);

      const youtubeVideoId = await Promise.race([
        searchYouTube(process.env.YOUTUBE_API_KEY, article.headline, item.author),
        timeout(10000),
      ]);
      if (youtubeVideoId) console.log(`  YouTube: ${youtubeVideoId}`);

      // Use RSS image if available, otherwise fetch from Unsplash
      let imageUrl = item.image || null;
      if (!imageUrl && process.env.UNSPLASH_ACCESS_KEY) {
        imageUrl = await Promise.race([
          fetchUnsplashImage(process.env.UNSPLASH_ACCESS_KEY, article.headline, article.category),
          timeout(10000),
        ]).catch(() => null);
        if (imageUrl) console.log(`  Unsplash image fetched`);
      }

      const result = saveArticle(db, {
        tweetId: item.id,
        author: item.author,
        tweetText: item.text,
        tweetUrl: item.url,
        headline: article.headline,
        sections: article.sections,
        faqs: article.faqs,
        category: article.category,
        youtubeVideoId,
        imageUrl,
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
