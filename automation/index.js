'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { fetchTweets } = require('./twitter');
const { generateArticle } = require('./openrouter');
const { openDb, getExistingTweetIds, saveArticle } = require('./db');

async function run() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!bearerToken || !apiKey) {
    throw new Error('Missing TWITTER_BEARER_TOKEN or OPENROUTER_API_KEY');
  }

  const db = openDb();
  const existing = getExistingTweetIds(db);

  console.log(`Fetching tweets...`);
  const tweets = await fetchTweets(bearerToken);
  const newTweets = tweets.filter((t) => !existing.has(t.tweetId));
  console.log(`${tweets.length} fetched, ${newTweets.length} new`);

  let saved = 0;
  for (const tweet of newTweets) {
    try {
      console.log(`Generating article for tweet ${tweet.tweetId} by @${tweet.author}...`);
      const article = await generateArticle(apiKey, tweet);
      const inserted = saveArticle(db, {
        tweetId: tweet.tweetId,
        author: tweet.author,
        tweetText: tweet.text,
        tweetUrl: tweet.tweetUrl,
        headline: article.headline,
        body: article.body,
        category: article.category,
      });
      if (inserted) saved++;
    } catch (err) {
      console.error(`Failed tweet ${tweet.tweetId}: ${err.message}`);
    }
  }

  console.log(`Done. Saved ${saved} new articles.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
