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

function extractImage(item) {
  // enclosure (standard RSS)
  if (item.enclosure?.url && item.enclosure.url.match(/\.(jpe?g|png|webp|gif)/i)) {
    return item.enclosure.url;
  }
  // media:content / media:thumbnail
  const media = item['media:content'] || item['media:thumbnail'];
  if (media?.$.url) return media.$.url;
  if (Array.isArray(media) && media[0]?.$.url) return media[0].$.url;
  // og image in content:encoded
  const html = item['content:encoded'] || item.content || '';
  const m = html.match(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp))/i);
  if (m) return m[1];
  return null;
}

async function fetchItems() {
  const parser = new Parser({
    timeout: 10000,
    customFields: {
      item: [
        ['media:content', 'media:content', { keepArray: false }],
        ['media:thumbnail', 'media:thumbnail', { keepArray: false }],
        ['content:encoded', 'content:encoded'],
      ],
    },
  });
  const results = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items.slice(0, ITEMS_PER_FEED)) {
        const id = item.link || item.guid;
        if (!id) continue;
        // Use full content:encoded HTML stripped to plain text, fallback to contentSnippet
        const fullHtml = item['content:encoded'] || item.content || '';
        const fullText = fullHtml
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 4000);
        const text = fullText || item.contentSnippet || item.title || '';

        results.push({
          id,
          author: feed.name,
          title: item.title || '',
          text,
          url: item.link || id,
          image: extractImage(item) || null,
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
