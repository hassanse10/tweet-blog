'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { fetchItems } = require('./rss');
const { generateArticle } = require('./openrouter');
const { openDb, getExistingTweetIds, saveArticle, saveTranslation } = require('./db');
const { sendNotifications } = require('./notify');
const { searchYouTube } = require('./youtube');
const { translateArticle } = require('./translate');

const TRANSLATE_LANGS = ['de', 'es'];

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

      const youtubeVideoId = await searchYouTube(process.env.YOUTUBE_API_KEY, article.headline, item.author);
      if (youtubeVideoId) console.log(`  YouTube: ${youtubeVideoId}`);

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
      });

      if (result) {
        saved.push({ id: result.id, author: item.author, headline: article.headline });

        // Translate to DE and ES
        if (process.env.DEEPL_API_KEY) {
          for (const lang of TRANSLATE_LANGS) {
            try {
              const translated = await translateArticle(process.env.DEEPL_API_KEY, {
                headline: article.headline,
                sections: article.sections,
                faqs: article.faqs,
              }, lang);
              saveTranslation(db, result.id, lang, translated);
              console.log(`  Translated to ${lang}`);
            } catch (err) {
              console.error(`  Translation to ${lang} failed: ${err.message}`);
            }
          }
        }
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
