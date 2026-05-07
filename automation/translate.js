'use strict';

function getDeepLUrl(apiKey) {
  // Free keys end with ':fx', paid keys use the main endpoint
  return apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
}

async function translateBatch(texts, targetLang, apiKey) {
  const res = await fetch(getDeepLUrl(apiKey), {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang.toUpperCase(),
      source_lang: 'EN',
    }),
  });
  if (!res.ok) throw new Error(`DeepL error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.translations.map((t) => t.text);
}

async function translateArticle(apiKey, { headline, sections, faqs }, targetLang) {
  const sects = sections || [];
  const faqList = faqs || [];

  // One API call per language — batch all strings together
  const texts = [
    headline,
    ...sects.map((s) => s.heading),
    ...sects.map((s) => s.body),
    ...faqList.map((f) => f.question),
    ...faqList.map((f) => f.answer),
  ];

  const translated = await translateBatch(texts, targetLang, apiKey);

  const n = sects.length;
  const m = faqList.length;

  return {
    headline: translated[0],
    sections: sects.map((s, i) => ({
      heading: translated[1 + i],
      body: translated[1 + n + i],
    })),
    faqs: faqList.map((f, i) => ({
      question: translated[1 + 2 * n + i],
      answer: translated[1 + 2 * n + m + i],
    })),
  };
}

module.exports = { translateArticle };
