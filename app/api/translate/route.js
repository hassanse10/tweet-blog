import { getArticleBySlug, getTranslation, saveTranslation } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const LANG_NAMES = { es: 'Spanish', fr: 'French' };

export async function POST(request) {
  const { slug, lang } = await request.json();

  if (!slug || !LANG_NAMES[lang]) {
    return Response.json({ error: 'Invalid slug or lang' }, { status: 400 });
  }

  const article = getArticleBySlug(slug);
  if (!article) return Response.json({ error: 'Article not found' }, { status: 404 });

  // Return cached translation if available
  const cached = getTranslation(article.id, lang);
  if (cached) return Response.json({ summary: cached, cached: true });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: 'Translation unavailable' }, { status: 503 });

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://1minai.site',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [{
          role: 'user',
          content: `Translate the following AI news article summary into ${LANG_NAMES[lang]}. Keep the same structure (headline on first line, then paragraphs). Preserve technical terms in English (model names, company names, etc). Output ONLY the translated text, no explanation.\n\n${article.summary}`,
        }],
        max_tokens: 1500,
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    if (!translated) throw new Error('Empty translation');

    saveTranslation(article.id, lang, translated);
    return Response.json({ summary: translated, cached: false });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
