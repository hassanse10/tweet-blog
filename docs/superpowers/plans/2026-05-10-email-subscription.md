# Email Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Resend-powered email digest subscription system that runs alongside the existing push notification banner, letting users subscribe to daily or weekly AI article digests filtered by source.

**Architecture:** A new `EmailSubscriptionBanner` component sits below `NotificationBanner` in the header. Subscribers are stored in Upstash Redis under `email-sub:<sha256>` keys. An `/api/send-digest` endpoint (called by n8n cron) reads all subscribers, fetches matching recent articles from SQLite, and sends digests via Resend.

**Tech Stack:** Next.js 14, Resend SDK, @upstash/redis, better-sqlite3, Tailwind CSS

> **Note:** This project has no test framework configured. Verification steps use `curl` for API routes and browser manual testing for the UI component.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/resend.js` | Create | Resend client singleton |
| `lib/digest-token.js` | Create | Sign/verify unsubscribe tokens |
| `lib/db.js` | Modify | Add `getRecentArticlesBySource` |
| `app/api/subscribe-email/route.js` | Create | POST / PUT / DELETE subscriber |
| `app/api/unsubscribe/route.js` | Create | One-click unsubscribe from email link |
| `app/api/send-digest/route.js` | Create | Fetch subscribers + send digests via Resend |
| `app/components/EmailSubscriptionBanner.jsx` | Create | Email subscription UI |
| `app/layout.jsx` | Modify | Mount `EmailSubscriptionBanner` below `NotificationBanner` |

---

## Task 1: Install Resend and create lib/resend.js

**Files:**
- Modify: `package.json`
- Create: `lib/resend.js`

- [ ] **Step 1: Install resend package**

```bash
npm install resend
```

Expected output: `added 1 package` (or similar, no errors)

- [ ] **Step 2: Create lib/resend.js**

```js
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
```

- [ ] **Step 3: Commit**

```bash
git add lib/resend.js package.json package-lock.json
git commit -m "feat: add resend client"
```

---

## Task 2: Create lib/digest-token.js

Shared token utilities used by both `/api/send-digest` and `/api/unsubscribe`. Putting them here avoids a circular import between the two route files.

**Files:**
- Create: `lib/digest-token.js`

- [ ] **Step 1: Create lib/digest-token.js**

```js
import { createHash } from 'crypto';

export function makeToken(email) {
  const hash = createHash('sha256')
    .update(email + process.env.DIGEST_SECRET)
    .digest('hex');
  return Buffer.from(email).toString('base64url') + ':' + hash;
}

export function verifyToken(token) {
  try {
    const [b64, sig] = (token || '').split(':');
    const email = Buffer.from(b64, 'base64url').toString();
    const expected = createHash('sha256')
      .update(email + process.env.DIGEST_SECRET)
      .digest('hex');
    if (sig !== expected) return null;
    return email;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/digest-token.js
git commit -m "feat: add digest token sign/verify utilities"
```

---

## Task 3: Add getRecentArticlesBySource to lib/db.js

**Files:**
- Modify: `lib/db.js`

- [ ] **Step 1: Add the function before the module.exports line**

In `lib/db.js`, add this function before the `module.exports` line at the bottom:

```js
function getRecentArticlesBySource(source, sinceISO, limit = 10) {
  const db = openDb();
  return db.prepare(`
    SELECT ${ARTICLE_COLS} FROM articles
    WHERE author = ? AND created_at > ?
    ORDER BY created_at DESC LIMIT ?
  `).all(source, sinceISO, limit).map(parseArticle);
}
```

- [ ] **Step 2: Export it — update the module.exports line**

Change the existing `module.exports` line from:

```js
module.exports = { searchArticles, getArticleById, getArticleBySlug, getRelatedArticles, getNextArticle, getCategories, getDistinctSources, rateArticle };
```

To:

```js
module.exports = { searchArticles, getArticleById, getArticleBySlug, getRelatedArticles, getNextArticle, getCategories, getDistinctSources, rateArticle, getRecentArticlesBySource };
```

- [ ] **Step 3: Verify manually — start dev server and check no import errors**

```bash
npm run dev
```

Expected: server starts with no errors referencing `lib/db.js`

- [ ] **Step 4: Commit**

```bash
git add lib/db.js
git commit -m "feat: add getRecentArticlesBySource to db"
```

---

## Task 4: Create /api/subscribe-email route

**Files:**
- Create: `app/api/subscribe-email/route.js`

- [ ] **Step 1: Create app/api/subscribe-email/route.js**

```js
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import redis from '../../../lib/redis';

const ALLOWED_SOURCES = ['OpenAI', 'Anthropic', 'Google AI', 'DeepMind', 'Meta AI', 'HuggingFace'];
const ALLOWED_FREQUENCIES = ['daily', 'weekly'];

function emailKey(email) {
  return `email-sub:${createHash('sha256').update(email).digest('hex')}`;
}

function validate({ email, sources, frequency } = {}) {
  if (!email || typeof email !== 'string' || email.length > 200 || !email.includes('@')) return false;
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > 20) return false;
  if (!sources.every((s) => ALLOWED_SOURCES.includes(s))) return false;
  if (!ALLOWED_FREQUENCIES.includes(frequency)) return false;
  return true;
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body || !validate(body)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const { email, sources, frequency } = body;
  await redis.set(emailKey(email), { email, sources, frequency, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json().catch(() => null);
  if (!body || !validate(body)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const { email, sources, frequency } = body;
  const key = emailKey(email);
  const existing = await redis.get(key);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await redis.set(key, { ...existing, sources, frequency });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const body = await req.json().catch(() => null);
  const { email } = body || {};
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  await redis.del(emailKey(email));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify POST — dev server must be running**

```bash
curl -s -X POST http://localhost:3000/api/subscribe-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","sources":["OpenAI","Anthropic"],"frequency":"daily"}' | cat
```

Expected: `{"ok":true}`

- [ ] **Step 3: Verify validation rejects bad payload**

```bash
curl -s -X POST http://localhost:3000/api/subscribe-email \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","sources":[],"frequency":"monthly"}' | cat
```

Expected: `{"error":"Invalid payload"}` with status 400

- [ ] **Step 4: Commit**

```bash
git add app/api/subscribe-email/route.js
git commit -m "feat: add subscribe-email API route"
```

---

## Task 5: Create /api/unsubscribe route

**Files:**
- Create: `app/api/unsubscribe/route.js`

- [ ] **Step 1: Create app/api/unsubscribe/route.js**

```js
import { createHash } from 'crypto';
import redis from '../../../lib/redis';
import { verifyToken } from '../../../lib/digest-token';

function emailKey(email) {
  return `email-sub:${createHash('sha256').update(email).digest('hex')}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  const email = verifyToken(token);
  if (!email) {
    return new Response('<h1>Invalid link</h1><p>This unsubscribe link is invalid or expired.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }
  await redis.del(emailKey(email));
  return new Response(
    '<h1 style="font-family:sans-serif">Unsubscribed</h1><p style="font-family:sans-serif">You have been removed from AI Digest emails.</p>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
```

- [ ] **Step 2: Verify bad token returns 400**

```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/unsubscribe?token=badtoken"
```

Expected: `400`

- [ ] **Step 3: Commit**

```bash
git add app/api/unsubscribe/route.js
git commit -m "feat: add one-click unsubscribe route"
```

---

## Task 6: Create /api/send-digest route

**Files:**
- Create: `app/api/send-digest/route.js`

- [ ] **Step 1: Create app/api/send-digest/route.js**

```js
import { NextResponse } from 'next/server';
import { resend } from '../../../lib/resend';
import redis from '../../../lib/redis';
import { getRecentArticlesBySource } from '../../../lib/db';
import { makeToken } from '../../../lib/digest-token';

const BASE_URL = 'https://1minai.site';

function buildEmailHtml(articles, unsubToken, frequency) {
  const rows = articles.map((a) => {
    const lines = (a.summary || '').split('\n').filter(Boolean);
    const title = lines[0] || 'Article';
    const excerpt = lines[1] || '';
    const url = `${BASE_URL}/article/${a.slug || a.id}`;
    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e2e8f0">
          <a href="${url}" style="display:block;color:#4f46e5;font-size:16px;font-weight:600;text-decoration:none;margin-bottom:4px">${title}</a>
          <span style="display:inline-block;background:#f1f5f9;color:#64748b;font-size:11px;padding:2px 8px;border-radius:12px;margin-bottom:6px">${a.author}</span>
          ${excerpt ? `<p style="margin:0;color:#475569;font-size:14px;line-height:1.5">${excerpt}</p>` : ''}
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <h1 style="margin:0 0 24px;color:#4f46e5;font-size:24px">AI Digest</h1>
    <table width="100%" style="border-collapse:collapse">${rows}</table>
    <p style="margin-top:32px;font-size:12px;color:#94a3b8;text-align:center">
      You're receiving this ${frequency} digest from
      <a href="${BASE_URL}" style="color:#94a3b8">AI Digest</a>.
      &nbsp;<a href="${BASE_URL}/api/unsubscribe?token=${unsubToken}" style="color:#94a3b8">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

export async function POST(req) {
  if (req.headers.get('x-digest-secret') !== process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const isMonday = today.getDay() === 1;

  const keys = await redis.keys('email-sub:*');
  if (!keys.length) return NextResponse.json({ sent: 0, skipped: 0 });

  const subs = await redis.mget(...keys);

  let sent = 0;
  let skipped = 0;

  for (const sub of subs) {
    if (!sub) { skipped++; continue; }
    const { email, sources, frequency } = sub;

    if (frequency === 'weekly' && !isMonday) { skipped++; continue; }

    const sinceDays = frequency === 'weekly' ? 7 : 1;
    const sinceISO = new Date(today - sinceDays * 24 * 60 * 60 * 1000).toISOString();

    const seen = new Set();
    const articles = [];
    for (const source of sources) {
      const found = getRecentArticlesBySource(source, sinceISO, 5);
      for (const a of found) {
        if (!seen.has(a.id)) { seen.add(a.id); articles.push(a); }
      }
    }

    if (!articles.length) { skipped++; continue; }

    const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const subject = frequency === 'weekly'
      ? `AI Digest — Week of ${dateStr}`
      : `AI Digest — ${dateStr}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject,
      html: buildEmailHtml(articles, makeToken(email), frequency),
    });

    sent++;
  }

  return NextResponse.json({ sent, skipped });
}
```

- [ ] **Step 2: Verify auth rejects missing secret**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/send-digest
```

Expected: `401`

- [ ] **Step 3: Commit**

```bash
git add app/api/send-digest/route.js
git commit -m "feat: add send-digest API route"
```

---

## Task 7: Create EmailSubscriptionBanner component

**Files:**
- Create: `app/components/EmailSubscriptionBanner.jsx`

- [ ] **Step 1: Create app/components/EmailSubscriptionBanner.jsx**

```jsx
'use client';

import { useState, useEffect } from 'react';

const SOURCES = ['OpenAI', 'Anthropic', 'Google AI', 'DeepMind', 'Meta AI', 'HuggingFace'];
const DISMISS_KEY = 'email_sub_dismissed';
const ADDRESS_KEY = 'email_sub_address';
const SOURCES_KEY = 'email_sub_sources';
const FREQ_KEY = 'email_sub_frequency';

export default function EmailSubscriptionBanner() {
  const [state, setState] = useState('hidden');
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState(['OpenAI', 'Anthropic']);
  const [frequency, setFrequency] = useState('daily');
  const [savedData, setSavedData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const address = localStorage.getItem(ADDRESS_KEY);
    const sources = localStorage.getItem(SOURCES_KEY);
    const freq = localStorage.getItem(FREQ_KEY);
    if (address && sources && freq) {
      setEmail(address);
      setSavedData({ sources: JSON.parse(sources), frequency: freq });
      setState('subscribed');
    } else if (!localStorage.getItem(DISMISS_KEY)) {
      setState('collapsed');
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setState('hidden');
  }

  function toggleSource(source) {
    setSelected((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }

  function startExpand() {
    setError('');
    if (email && !email.includes('@')) { setError('Enter a valid email'); return; }
    setState('expanded');
  }

  async function subscribe() {
    setError('');
    if (!email || !email.includes('@')) { setError('Enter a valid email'); return; }
    const res = await fetch('/api/subscribe-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, sources: selected, frequency }),
    });
    if (!res.ok) { setError('Failed to subscribe. Try again.'); return; }
    localStorage.setItem(ADDRESS_KEY, email);
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    localStorage.setItem(FREQ_KEY, frequency);
    setSavedData({ sources: selected, frequency });
    setState('subscribed');
  }

  async function savePreferences() {
    setError('');
    const res = await fetch('/api/subscribe-email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, sources: selected, frequency }),
    });
    if (!res.ok) { setError('Failed to save. Try again.'); return; }
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    localStorage.setItem(FREQ_KEY, frequency);
    setSavedData({ sources: selected, frequency });
    setState('subscribed');
  }

  async function unsubscribe() {
    const res = await fetch('/api/subscribe-email', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { setError('Failed to unsubscribe. Try again.'); return; }
    localStorage.removeItem(ADDRESS_KEY);
    localStorage.removeItem(SOURCES_KEY);
    localStorage.removeItem(FREQ_KEY);
    localStorage.removeItem(DISMISS_KEY);
    setSavedData(null);
    setState('collapsed');
  }

  if (state === 'hidden') return null;

  if (state === 'subscribed') {
    return (
      <div className="bg-emerald-950 border-b border-emerald-900 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-emerald-400">📧 Email digest:</span>
          <span className="text-emerald-300 text-xs">{savedData?.frequency}</span>
          {savedData?.sources?.map((s) => (
            <span key={s} className="bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full text-xs">{s}</span>
          ))}
        </div>
        <button
          onClick={() => { setSelected(savedData.sources); setFrequency(savedData.frequency); setError(''); setState('editing'); }}
          className="text-emerald-400 text-xs underline shrink-0 ml-2"
        >
          Edit
        </button>
      </div>
    );
  }

  if (state === 'collapsed') {
    return (
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm shrink-0">📧</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startExpand()}
            placeholder="your@email.com — get a digest"
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-1 flex-1 min-w-0 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={startExpand}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-sm transition-colors shrink-0"
          >
            Get digest
          </button>
          <button onClick={dismiss} className="text-gray-500 text-lg leading-none shrink-0">✕</button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1 pl-6">{error}</p>}
      </div>
    );
  }

  // state === 'expanded' | 'editing'
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <p className="text-gray-300 text-sm mb-2">
        {state === 'editing' ? '📧 Update digest preferences:' : '📧 Choose sources and frequency:'}
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {SOURCES.map((source) => (
          <button
            key={source}
            onClick={() => toggleSource(source)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selected.includes(source)
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            {selected.includes(source) ? '✓ ' : ''}{source}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400 text-sm">Frequency:</span>
        {['daily', 'weekly'].map((f) => (
          <button
            key={f}
            onClick={() => setFrequency(f)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              frequency === f
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={state === 'editing' ? savePreferences : subscribe}
          disabled={selected.length === 0}
          className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm transition-colors"
        >
          {state === 'editing' ? 'Save Preferences' : 'Subscribe →'}
        </button>
        <button
          onClick={() => setState(state === 'editing' ? 'subscribed' : 'collapsed')}
          className="text-gray-400 text-sm"
        >
          Cancel
        </button>
        {state === 'editing' && (
          <button onClick={unsubscribe} className="text-red-400 text-sm ml-auto">
            Unsubscribe
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/EmailSubscriptionBanner.jsx
git commit -m "feat: add EmailSubscriptionBanner component"
```

---

## Task 8: Wire EmailSubscriptionBanner into layout.jsx

**Files:**
- Modify: `app/layout.jsx`

- [ ] **Step 1: Add import at top of app/layout.jsx**

After the existing `import NotificationBanner from './components/NotificationBanner';` line, add:

```js
import EmailSubscriptionBanner from './components/EmailSubscriptionBanner';
```

- [ ] **Step 2: Mount component after NotificationBanner**

Find the line `<NotificationBanner />` and add `<EmailSubscriptionBanner />` directly below it:

```jsx
<NotificationBanner />
<EmailSubscriptionBanner />
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000`. You should see:
- Push notification banner (existing, blue/indigo)
- Email digest banner below it (dark gray with email input)

Test the full flow:
1. Enter a valid email → click "Get digest" → source picker and frequency appear
2. Select sources → pick Daily or Weekly → click "Subscribe →"
3. Banner shows green "📧 Email digest: daily · OpenAI · Anthropic"
4. Click "Edit" → preferences form reappears with current values
5. Click "Unsubscribe" → banner returns to collapsed state
6. Click ✕ on collapsed banner → banner hides completely

- [ ] **Step 4: Commit**

```bash
git add app/layout.jsx
git commit -m "feat: mount EmailSubscriptionBanner in layout"
```

---

## Task 9: Add environment variables

- [ ] **Step 1: Add to .env.local (create if it doesn't exist)**

```
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=digest@yourdomain.com
DIGEST_SECRET=a-long-random-secret-string
```

Get `RESEND_API_KEY` from [resend.com/api-keys](https://resend.com/api-keys).

`RESEND_FROM_EMAIL` must be a verified domain in your Resend account. During development you can use `onboarding@resend.dev` (Resend's sandbox sender) but it only delivers to your own verified email address.

`DIGEST_SECRET` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- [ ] **Step 2: Verify .env.local is in .gitignore**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` appears in the output. If not, add it.

- [ ] **Step 3: Restart dev server to pick up new env vars**

Stop and restart `npm run dev`.

---

## Task 10: End-to-end test

- [ ] **Step 1: Subscribe via the UI**

Visit `http://localhost:3000`, enter your own email, pick sources, pick Daily, click Subscribe.

- [ ] **Step 2: Trigger digest manually**

```bash
curl -s -X POST http://localhost:3000/api/send-digest \
  -H "x-digest-secret: YOUR_DIGEST_SECRET_HERE" | cat
```

Expected: `{"sent":1,"skipped":0}` (or `{"sent":0,"skipped":1}` if no articles from the last 24h match your sources — that's correct behaviour)

- [ ] **Step 3: Check your inbox**

You should receive an AI Digest email. Verify:
- Subject: `AI Digest — [today's date]`
- Articles appear with titles, source tags, excerpts
- Unsubscribe link at the bottom works (clicking it hits `/api/unsubscribe` and shows the confirmation page)

- [ ] **Step 4: Final commit**

```bash
git add .env.local.example
git commit -m "chore: add env.local.example for email subscription vars"
```

> Create `.env.local.example` with the variable names but no values, so teammates know what to set.

---

## n8n Setup (post-deployment)

After deploying to production, add these workflows in n8n:

**Daily digest workflow:**
- Trigger: Cron `0 8 * * *` (every day at 8 AM)
- Node: HTTP Request
  - Method: POST
  - URL: `https://1minai.site/api/send-digest`
  - Headers: `x-digest-secret: <your DIGEST_SECRET>`

**Weekly digest workflow:**
- Trigger: Cron `0 8 * * 1` (every Monday at 8 AM)
- Node: HTTP Request (same config)

Both can be a single workflow — `/api/send-digest` handles the Monday filter internally for weekly subscribers.
