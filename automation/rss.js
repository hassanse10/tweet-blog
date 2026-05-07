'use strict';

const Parser = require('rss-parser');

const FEEDS = [
  { name: 'OpenAI',        url: 'https://openai.com/blog/rss.xml' },
  { name: 'Anthropic',     url: 'https://www.anthropic.com/rss.xml' },
  { name: 'HuggingFace',   url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Google AI',     url: 'https://blog.google/technology/ai/rss/' },
  { name: 'DeepMind',      url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Meta AI',       url: 'https://ai.meta.com/blog/feed/' },
];

const ITEMS_PER_FEED = 5;

async function fetchItems() {
  const parser = new Parser({ timeout: 10000 });
  const results = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items.slice(0, ITEMS_PER_FEED)) {
        const id = item.link || item.guid;
        if (!id) continue;
        results.push({
          id,
          author: feed.name,
          title: item.title || '',
          text: item.contentSnippet || item.title || '',
          url: item.link || id,
          pubDate: item.isoDate || item.pubDate || null,
        });
      }
      console.log(`  ${feed.name}: ${Math.min(parsed.items.length, ITEMS_PER_FEED)} items`);
    } catch (err) {
      console.error(`  ${feed.name}: failed (${err.message})`);
    }
  }

  return results;
}

module.exports = { fetchItems };
