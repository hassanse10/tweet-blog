import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import redis from '../../../lib/redis';

function subKey(endpoint) {
  return `sub:${createHash('sha256').update(endpoint).digest('hex')}`;
}

export async function POST(req) {
  const { subscription, sources } = await req.json();
  if (!subscription?.endpoint || !Array.isArray(sources) || sources.length === 0) {
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
  const { subscription, sources } = await req.json();
  if (!subscription?.endpoint || !Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const key = subKey(subscription.endpoint);
  const existing = await redis.get(key);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await redis.set(key, { ...existing, sources });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  await redis.del(subKey(endpoint));
  return NextResponse.json({ ok: true });
}
