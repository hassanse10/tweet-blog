import { backfillOgImages } from '../../../lib/og';
import { openDb } from '../../../lib/db';

export const dynamic = 'force-dynamic';

// POST /api/fetch-images  — manually trigger OG image backfill
export async function POST() {
  try {
    const db = openDb();
    await backfillOgImages(db);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
