import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import redis from '../../../lib/redis';

function subKey(endpoint) {
  return `sub:${createHash('sha256').update(endpoint).digest('hex')}`;
}

function validateSources(sources) {
  return Array.isArray(sources) &&
    sources.length > 0 &&
    sources.length <= 20 &&
    sources.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 100);
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const { subscription, sources } = body;
  if (!subscription?.endpoint || !validateSources(sources)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  await redis.set(subKey(subscription.endpoint), {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    sources,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const { subscription, sources } = body;
  if (!subscription?.endpoint || !validateSources(sources)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const key = subKey(subscription.endpoint);
  const existing = await redis.get(key);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await redis.set(key, { ...existing, sources });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  await redis.del(subKey(endpoint));
  return NextResponse.json({ ok: true });
}
