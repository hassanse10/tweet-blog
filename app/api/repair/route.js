'use strict';

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const SECRET = process.env.REPAIR_SECRET || 'repair-1minai-2026';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'db/articles.db');
  const db = new Database(dbPath);

  const action = searchParams.get('action') || 'repair';
  const articles = db.prepare('SELECT id, sections FROM articles').all();

  let affected = 0;
  let skipped = 0;
  const log = [];

  const deleteArticle = db.prepare('DELETE FROM articles WHERE id = ?');
  const deleteFts = db.prepare('DELETE FROM articles_fts WHERE rowid = ?');
  const update = db.prepare(
    'UPDATE articles SET summary = ?, sections = ?, faqs = ?, category = ? WHERE id = ?'
  );

  for (const article of articles) {
    let sections;
    try { sections = JSON.parse(article.sections); } catch { skipped++; continue; }

    const isSingleFallback = sections.length === 1 && typeof sections[0].body === 'string';
    const bodyLooksLikeJson = isSingleFallback && (
      sections[0].body.includes('"sections"') ||
      sections[0].body.includes('```json') ||
      sections[0].body.trimStart().startsWith('{')
    );

    if (!bodyLooksLikeJson) { skipped++; continue; }

    if (action === 'delete') {
      deleteArticle.run(article.id);
      deleteFts.run(article.id);
      log.push(`Deleted article ${article.id}`);
      affected++;
    } else {
      const raw = sections[0].body.trim();
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        const newSections = Array.isArray(parsed.sections) ? parsed.sections : [];
        const newFaqs = Array.isArray(parsed.faqs) ? parsed.faqs : [];
        const newCategory = parsed.category || 'AI';
        const newHeadline = parsed.headline || '';
        const body = newSections.map((s) => s.body).join('\n\n');
        update.run(`${newHeadline}\n\n${body}`, JSON.stringify(newSections), JSON.stringify(newFaqs), newCategory, article.id);
        log.push(`Fixed ${article.id}: ${newHeadline.slice(0, 60)}`);
        affected++;
      } catch {
        log.push(`Could not repair ${article.id}`);
        skipped++;
      }
    }
  }

  return NextResponse.json({ action, affected, skipped, log });
}
