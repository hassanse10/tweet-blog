import { NextResponse } from 'next/server';
import { getArticleById } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export function GET(_req, { params }) {
  const article = getArticleById(Number(params.id));
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(article);
}
