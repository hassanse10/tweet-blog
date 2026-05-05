'use strict';

const SYSTEM_PROMPT =
  'You are a concise technology news writer. Write a short article based on the tweet text. ' +
  'Start with a single headline on the first line (no label, just the title text), then a blank line, ' +
  'then the article body. Keep it easy to read in one minute.';

/**
 * Generate a short article from a tweet using OpenRouter (Claude 3.5 Sonnet).
 * @param {string} apiKey  OpenRouter API key
 * @param {{ author: string, text: string }} tweet
 * @returns {Promise<string>} Article text
 */
async function generateArticle(apiKey, tweet) {
  const userPrompt =
    `Create a 1-minute article that summarizes the most important thing to know from this tweet by @${tweet.author}:\n\n` +
    `"${tweet.text}"\n\n` +
    `Mention who posted it, what changed, and why it matters. Keep it short, clear, and readable.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.5
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = { generateArticle };
