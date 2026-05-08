import { NextResponse } from 'next/server';
import { rateArticle } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const delta = body.delta === -1 ? -1 : 1;

  const rating = rateArticle(id, delta);
  if (rating === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ rating });
}
