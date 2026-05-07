import { NextResponse } from 'next/server';
import { getNextArticle } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const exclude = (searchParams.get('exclude') || '')
    .split(',')
    .map(Number)
    .filter(Boolean);

  if (!category) return NextResponse.json({ article: null });

  const article = getNextArticle(category, exclude);
  return NextResponse.json({ article });
}
