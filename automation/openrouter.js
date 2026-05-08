'use strict';

const SYSTEM_PROMPT =
  'You are a technology news writer. Given an AI news article, return a JSON object with these fields:\n' +
  '- "headline": a short punchy title (no label, just the text)\n' +
  '- "category": one of exactly: AI, Research, Product, Policy, Other\n' +
  '- "sections": array of 3 objects, each with "heading" (string) and "body" (2-3 sentences)\n' +
  '- "faqs": array of 3 objects, each with "question" and "answer" (1-2 sentences) that visitors might ask\n\n' +
  'Respond with ONLY valid JSON. No markdown, no code blocks.';

async function generateArticle(apiKey, item) {
  const userPrompt =
    `Source: ${item.author}\nTitle: ${item.title}\n\n${item.text}\n\nWrite the JSON article object.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 900,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from OpenRouter');
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  try {
    const parsed = JSON.parse(text);
    return {
      headline: parsed.headline || item.title || 'AI Update',
      category: parsed.category || 'AI',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
    };
  } catch {
    return {
      headline: item.title || 'AI Update',
      category: 'AI',
      sections: [{ heading: 'Summary', body: text }],
      faqs: [],
    };
  }
}

module.exports = { generateArticle };
