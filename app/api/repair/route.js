import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const SECRET = process.env.REPAIR_SECRET || 'repair-1minai-2026';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'db/articles.db');
    const db = new Database(dbPath);

    // Find all articles where summary contains raw JSON markers
    const corrupted = db.prepare(`
      SELECT id, summary FROM articles
      WHERE summary LIKE '%\`\`\`json%'
         OR summary LIKE '%"headline"%'
         OR summary LIKE '%"sections"%'
    `).all();

    const deleted = [];
    for (const row of corrupted) {
      db.prepare('DELETE FROM articles WHERE id = ?').run(row.id);
      deleted.push(row.id);
    }

    return NextResponse.json({ deleted: deleted.length, ids: deleted });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
