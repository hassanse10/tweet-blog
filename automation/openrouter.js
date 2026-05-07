'use strict';

const SYSTEM_PROMPT =
  'You are a concise technology news writer. Given a tweet, return a JSON object with three fields:\n' +
  '- "headline": a short punchy title (no label, just the text)\n' +
  '- "body": a 2-3 sentence article body. Mention who posted it, what changed, and why it matters.\n' +
  '- "category": one of exactly: AI, Research, Product, Policy, Other\n\n' +
  'Respond with ONLY valid JSON. No markdown, no code blocks.';

async function generateArticle(apiKey, tweet) {
  const userPrompt =
    `Tweet by @${tweet.author}:\n\n"${tweet.text}"\n\n` +
    `Write the JSON article object.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();

  try {
    return JSON.parse(text);
  } catch {
    // fallback: treat whole text as body with generic headline
    return { headline: 'AI Update', body: text, category: 'AI' };
  }
}

module.exports = { generateArticle };
