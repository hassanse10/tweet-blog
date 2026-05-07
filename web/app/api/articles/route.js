import { NextResponse } from 'next/server';
import { searchArticles } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export function GET(req) {
  const { searchParams } = new URL(req.url);
  const q        = searchParams.get('q')        || '';
  const source   = searchParams.get('source')   || '';
  const category = searchParams.get('category') || '';
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  const result = searchArticles({ q, source, category, page, limit });
  return NextResponse.json(result);
}
