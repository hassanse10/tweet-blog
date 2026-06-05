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
  Each heading must be written specifically for THIS article — use the real entities, model names, companies, and topics involved. Never use generic headings like "What Happened" or "Background". Make each heading a specific, keyword-rich statement a reader would search for.

  The 4 sections must cover these roles in order:
  1. THE ANNOUNCEMENT — What was released, found, or decided. Specific details: numbers, model names, dates, capabilities. Heading example: "Meta Releases Llama 3.1 with 405B Parameters and Open Weights"
  2. THE CONTEXT — Why this moment exists. Prior state of the field, what problem was being solved, how this compares to what came before. Heading example: "How the Open-Source AI Race Pushed Meta to Go Bigger"
  3. THE IMPLICATIONS — Concrete impact on developers, researchers, businesses, or end users. Original analysis beyond restating the source. What changes as a result. Heading example: "Why Open Weights Change the Economics of Enterprise AI"
  4. THE UNKNOWNS — Open questions, known limitations, upcoming milestones. What readers should watch for. Heading example: "Llama 3.1 Fine-Tuning Costs and Safety Benchmarks Remain Unclear"

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
