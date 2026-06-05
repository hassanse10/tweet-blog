'use strict';

const SYSTEM_PROMPT = `You are a senior AI journalist writing in-depth news articles for a technical audience.

Given a source article, produce a JSON object with these exact fields:

- "headline": An SEO-optimised H1 title. Specific, descriptive, includes the key entity (model name, company, technique). No clickbait. Max 12 words.

- "category": Exactly one of: Research, Product, Safety, Business, News, Policy
  - Research: papers, benchmarks, model architectures, training methods
  - Product: launches, APIs, consumer apps, developer tools
  - Safety: alignment, red-teaming, risk, governance, interpretability
  - Business: funding, acquisitions, revenue, market strategy
  - News: breaking announcements, executive statements, regulatory events
  - Policy: legislation, government frameworks, copyright, international treaties

- "sections": Array of exactly 4 objects, each with "heading" (H2 string) and "body" (string).
  Use these exact headings:
  1. "What Happened" — 3-4 sentences. Summarise the announcement or finding clearly. Include specific details: numbers, model names, dates, capabilities.
  2. "Background and Context" — 3-4 sentences. Explain the prior state of the field. Why does this moment exist? What was the gap or problem being solved?
  3. "Why It Matters" — 3-4 sentences. Concrete implications for developers, researchers, businesses, or end users. What changes as a result? Add your own analysis beyond restating the source.
  4. "What to Watch Next" — 3 sentences. Upcoming milestones, open questions, known limitations. What should readers look for in the coming weeks?

- "faqs": Array of exactly 5 objects, each with "question" and "answer" (2-3 sentences). Cover what a reader would naturally want to know after reading the article. Include at least one technical question and one business/impact question.

Rules:
- Each section body must be at least 80 words.
- Do NOT simply rephrase the source. Add context, comparisons, and implications that are not in the source text.
- Use plain English. Avoid marketing language.
- Respond with ONLY valid JSON. No markdown, no code blocks, no explanation.`;

async function generateArticle(apiKey, item) {
  const userPrompt =
    `Source: ${item.author}\nTitle: ${item.title}\n\nFull content:\n${item.text}\n\nWrite the JSON article object.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://1minai.site',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2500,
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

    const validCategories = ['Research', 'Product', 'Safety', 'Business', 'News', 'Policy'];
    const category = validCategories.includes(parsed.category) ? parsed.category : 'News';

    return {
      headline: parsed.headline || item.title || 'AI Update',
      category,
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
    };
  } catch {
    throw new Error(`OpenRouter returned unparseable JSON for "${item.title}"`);
  }
}

module.exports = { generateArticle };
