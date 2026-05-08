'use strict';

const { openDb } = require('./db');

const db = openDb();

const articles = db.prepare("SELECT id, sections, faqs FROM articles").all();

let fixed = 0;
let skipped = 0;

const update = db.prepare(`
  UPDATE articles SET summary = ?, sections = ?, faqs = ?, category = ? WHERE id = ?
`);

for (const article of articles) {
  let sections;
  try {
    sections = JSON.parse(article.sections);
  } catch {
    skipped++;
    continue;
  }

  // Detect corrupted: single section whose body looks like raw JSON (with or without code fences)
  const isSingleFallback = sections.length === 1 && typeof sections[0].body === 'string';
  const bodyLooksLikeJson = isSingleFallback && (
    sections[0].body.includes('"sections"') ||
    sections[0].body.includes('```json') ||
    sections[0].body.trimStart().startsWith('{')
  );

  if (bodyLooksLikeJson) {
    const raw = sections[0].body.trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      const newSections = Array.isArray(parsed.sections) ? parsed.sections : [];
      const newFaqs = Array.isArray(parsed.faqs) ? parsed.faqs : [];
      const newCategory = parsed.category || 'AI';
      const newHeadline = parsed.headline || '';
      const body = newSections.map((s) => s.body).join('\n\n');
      const newSummary = `${newHeadline}\n\n${body}`;

      update.run(
        newSummary,
        JSON.stringify(newSections),
        JSON.stringify(newFaqs),
        newCategory,
        article.id,
      );

      console.log(`Fixed article ${article.id}: ${newHeadline.slice(0, 60)}`);
      fixed++;
    } catch (e) {
      console.warn(`Could not repair article ${article.id}: ${e.message}`);
      skipped++;
    }
  } else {
    skipped++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
