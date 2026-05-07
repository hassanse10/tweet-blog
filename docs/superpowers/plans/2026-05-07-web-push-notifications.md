# Web Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-source Web Push notifications so users get phone alerts when new articles arrive from their favourite AI companies.

**Architecture:** Subscriptions are stored in Upstash Redis (free hosted Redis), keyed by SHA-256 of the push endpoint. The GitHub Actions automation fetches subscriptions from Upstash after saving new articles and sends Web Push payloads directly. The Next.js app handles subscription CRUD via API routes and shows a banner with an inline source picker.

**Tech Stack:** `web-push` (VAPID push), `@upstash/redis` (subscription store), Next.js App Router API routes, Browser Push API + Service Worker

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `public/sw.js` | Create | Service worker — shows push notifications, handles click |
| `public/icon-192.png` | Create | 192×192 PNG notification icon |
| `lib/redis.js` | Create | Upstash Redis client singleton (ESM) |
| `app/api/vapid-key/route.js` | Create | Returns VAPID public key to browser |
| `app/api/subscribe/route.js` | Create | POST / PUT / DELETE subscription management |
| `app/components/NotificationBanner.jsx` | Create | Banner with 3 states: collapsed / expanded / subscribed |
| `app/layout.jsx` | Modify | Add `<NotificationBanner>` below header |
| `next.config.js` | Modify | Add no-cache header for `/sw.js` |
| `automation/notify.js` | Create | Reads Upstash subs, sends pushes after new articles saved |
| `automation/db.js` | Modify | `saveArticle` returns `{ id, headline }` or `null` |
| `automation/index.js` | Modify | Collect saved articles, call `sendNotifications` |
| `package.json` | Modify | Add `@upstash/redis` |
| `automation/package.json` | Modify | Add `web-push`, `@upstash/redis` |

---

## Task 1: Generate VAPID Keys + Create Upstash Redis Database

**Files:** none (setup only)

- [ ] **Step 1: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Expected output:
```
Public Key:
BA...long base64 string...

Private Key:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save both values — you'll need them in the next steps.

- [ ] **Step 2: Create Upstash Redis database**

Go to https://console.upstash.com → Create Database → name it `tweet-blog` → region: US-East-1 → free tier → Create.

After creation, copy:
- **REST URL** (looks like `https://xxxx.upstash.io`)
- **REST Token** (long token string)

- [ ] **Step 3: Create `.env.local` for local dev**

Create `c:\Users\HASSAN\App2\n8n\.env.local`:
```
VAPID_PUBLIC_KEY=<your public key from step 1>
VAPID_PRIVATE_KEY=<your private key from step 1>
VAPID_CONTACT_EMAIL=senhajihassan91@gmail.com
UPSTASH_REDIS_REST_URL=<your upstash REST URL>
UPSTASH_REDIS_REST_TOKEN=<your upstash REST token>
```

Add `.env.local` to `.gitignore` (it should already be there — verify with `grep env.local .gitignore`).

> **Note:** `.env.local` is read automatically by the Next.js dev server. The automation (`automation/index.js`) reads `.env` instead. To test the automation locally, copy these same vars into a `.env` file at the repo root (never commit it).

- [ ] **Step 4: Add all 5 env vars to Railway**

In Railway → tweet-blog service → Variables → add:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_CONTACT_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

- [ ] **Step 5: Add all 5 env vars to GitHub secrets**

In github.com/hassanse10/tweet-blog → Settings → Secrets and variables → Actions → New repository secret — add all 5.

---

## Task 2: Install Dependencies

**Files:** `package.json`, `automation/package.json`

- [ ] **Step 1: Install @upstash/redis in root (Next.js app)**

```bash
cd c:\Users\HASSAN\App2\n8n && npm install @upstash/redis
```

Expected: `added N packages`

- [ ] **Step 2: Install web-push and @upstash/redis in automation**

```bash
cd c:\Users\HASSAN\App2\n8n\automation && npm install web-push @upstash/redis
```

Expected: `added N packages`

- [ ] **Step 3: Commit**

```bash
cd c:\Users\HASSAN\App2\n8n
git add package.json package-lock.json automation/package.json automation/package-lock.json
git commit -m "chore: add web-push and upstash/redis dependencies"
```

---

## Task 3: Service Worker + Notification Icon

**Files:** `public/sw.js`, `public/icon-192.png`

- [ ] **Step 1: Create `public/sw.js`**

```js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'AI Digest', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';
  event.waitUntil(clients.openWindow(url));
});
```

- [ ] **Step 2: Create `public/icon-192.png`**

Go to https://favicon.io/favicon-generator/ → Text: `AI` → Background: Rounded → Background colour: `#4f46e5` → Font colour: `#ffffff` → Font size: 70 → Download → extract the `android-chrome-192x192.png` → rename to `icon-192.png` → save to `public/`.

- [ ] **Step 3: Update `next.config.js` to prevent SW caching**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Commit**

```bash
cd c:\Users\HASSAN\App2\n8n
git add public/sw.js public/icon-192.png next.config.js
git commit -m "feat: add service worker and notification icon"
```

---

## Task 4: Redis Client + Subscribe API

**Files:** `lib/redis.js`, `app/api/vapid-key/route.js`, `app/api/subscribe/route.js`

- [ ] **Step 1: Create `lib/redis.js`**

```js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;
```

- [ ] **Step 2: Create `app/api/vapid-key/route.js`**

```js
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
```

- [ ] **Step 3: Create `app/api/subscribe/route.js`**

```js
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
```

- [ ] **Step 4: Verify API routes locally**

Start dev server: `cd c:\Users\HASSAN\App2\n8n && npm run dev`

Test VAPID key endpoint:
```bash
curl http://localhost:3000/api/vapid-key
```
Expected: `{"publicKey":"BA..."}`

- [ ] **Step 5: Commit**

```bash
git add lib/redis.js app/api/vapid-key/route.js app/api/subscribe/route.js
git commit -m "feat: add subscribe API and Redis client"
```

---

## Task 5: NotificationBanner Component

**Files:** `app/components/NotificationBanner.jsx`

- [ ] **Step 1: Create `app/components/NotificationBanner.jsx`**

```jsx
'use client';

import { useState, useEffect } from 'react';

const SOURCES = ['OpenAI', 'Anthropic', 'Google AI', 'DeepMind', 'Meta AI', 'HuggingFace'];
const DISMISS_KEY = 'notif_dismissed';
const SOURCES_KEY = 'notif_sources';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationBanner() {
  // state: 'hidden' | 'collapsed' | 'expanded' | 'subscribed' | 'editing'
  const [state, setState] = useState('hidden');
  const [selected, setSelected] = useState(['OpenAI', 'Anthropic']);
  const [savedSources, setSavedSources] = useState([]);
  const [swReg, setSwReg] = useState(null);
  const [pushSub, setPushSub] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    (async () => {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setSwReg(reg);
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setPushSub(existing);
        const stored = localStorage.getItem(SOURCES_KEY);
        const sources = stored ? JSON.parse(stored) : [];
        setSavedSources(sources);
        setState('subscribed');
      } else if (!localStorage.getItem(DISMISS_KEY)) {
        setState('collapsed');
      }
    })();
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

  async function enableNotifications() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const { publicKey } = await fetch('/api/vapid-key').then((r) => r.json());
    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), sources: selected }),
    });
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    setPushSub(sub);
    setSavedSources(selected);
    setState('subscribed');
  }

  async function savePreferences() {
    await fetch('/api/subscribe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: pushSub.toJSON(), sources: selected }),
    });
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    setSavedSources(selected);
    setState('subscribed');
  }

  async function unsubscribe() {
    await pushSub.unsubscribe();
    await fetch('/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: pushSub.endpoint }),
    });
    localStorage.removeItem(SOURCES_KEY);
    localStorage.removeItem(DISMISS_KEY);
    setPushSub(null);
    setSavedSources([]);
    setState('collapsed');
  }

  if (state === 'hidden') return null;

  if (state === 'subscribed') {
    return (
      <div className="bg-indigo-950 border-b border-indigo-900 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-green-400">🔔 Subscribed:</span>
          {savedSources.map((s) => (
            <span key={s} className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full text-xs">
              {s}
            </span>
          ))}
        </div>
        <button
          onClick={() => { setSelected(savedSources); setState('editing'); }}
          className="text-indigo-400 text-xs underline shrink-0 ml-2"
        >
          Edit
        </button>
      </div>
    );
  }

  if (state === 'collapsed') {
    return (
      <div className="bg-indigo-900 border-b border-indigo-800 px-4 py-2 flex items-center justify-between">
        <span className="text-indigo-200 text-sm">🔔 Get notified when new AI articles drop</span>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <button
            onClick={() => setState('expanded')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Subscribe
          </button>
          <button onClick={dismiss} className="text-indigo-400 text-lg leading-none">✕</button>
        </div>
      </div>
    );
  }

  // state === 'expanded' | 'editing'
  return (
    <div className="bg-indigo-900 border-b border-indigo-800 px-4 py-3">
      <p className="text-indigo-200 text-sm mb-2">🔔 Pick the sources you want to follow:</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {SOURCES.map((source) => (
          <button
            key={source}
            onClick={() => toggleSource(source)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selected.includes(source)
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950 text-indigo-400 border border-indigo-700 hover:border-indigo-500'
            }`}
          >
            {selected.includes(source) ? '✓ ' : ''}{source}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={state === 'editing' ? savePreferences : enableNotifications}
          disabled={selected.length === 0}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm transition-colors"
        >
          {state === 'editing' ? 'Save Preferences' : 'Enable Notifications →'}
        </button>
        <button
          onClick={() => setState(state === 'editing' ? 'subscribed' : 'collapsed')}
          className="text-indigo-400 text-sm"
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
git add app/components/NotificationBanner.jsx
git commit -m "feat: add NotificationBanner component"
```

---

## Task 6: Wire Banner into Layout

**Files:** `app/layout.jsx`

- [ ] **Step 1: Update `app/layout.jsx`**

```jsx
import { Suspense } from 'react';
import './globals.css';
import ThemeToggle from './components/ThemeToggle';
import SearchBar from './components/SearchBar';
import NotificationBanner from './components/NotificationBanner';

export const metadata = {
  title: 'AI News Digest',
  description: 'Auto-generated articles from top AI companies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
            <a href="/" className="text-base font-bold tracking-tight text-gray-900 dark:text-white shrink-0 hover:text-blue-600 dark:hover:text-blue-400 transition">
              AI Digest
            </a>
            <Suspense>
              <SearchBar />
            </Suspense>
            <ThemeToggle />
          </div>
          <NotificationBanner />
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify locally**

With dev server running at `http://localhost:3000`:
- Open browser → banner appears below header with "Get notified when new AI articles drop"
- Click Subscribe → banner expands showing source pills
- Click "OpenAI" and "Anthropic" → they turn purple with ✓
- Click "Enable Notifications →" → browser asks for permission → allow
- Banner changes to green "🔔 Subscribed: OpenAI Anthropic"
- Check Upstash console → a `sub:xxxxx` key should appear

- [ ] **Step 3: Commit**

```bash
git add app/layout.jsx
git commit -m "feat: wire NotificationBanner into layout"
```

---

## Task 7: Automation Notify Module

**Files:** `automation/notify.js`, `automation/db.js`, `automation/index.js`

- [ ] **Step 1: Update `saveArticle` in `automation/db.js` to return inserted article info**

Replace the `saveArticle` function (lines 38-55 in automation/db.js):

```js
function saveArticle(db, { tweetId, author, tweetText, tweetUrl, headline, body, category }) {
  const summary = `${headline}\n\n${body}`;
  const info = db.prepare(`
    INSERT OR IGNORE INTO articles (tweet_id, author, tweet_text, tweet_url, summary, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tweetId, author, tweetText, tweetUrl, summary, category || 'Other');

  if (info.changes > 0) {
    db.prepare(`
      INSERT INTO articles_fts(rowid, headline, body) VALUES (?, ?, ?)
    `).run(info.lastInsertRowid, headline, body);
    return { id: info.lastInsertRowid, headline };
  }

  return null;
}
```

- [ ] **Step 2: Create `automation/notify.js`**

```js
'use strict';

const webpush = require('web-push');
const { Redis } = require('@upstash/redis');

async function sendNotifications(newArticles) {
  if (!newArticles.length) return;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL,
          UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !UPSTASH_REDIS_REST_URL) {
    console.log('Push env vars not set — skipping notifications');
    return;
  }

  webpush.setVapidDetails(
    `mailto:${VAPID_CONTACT_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  const redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  const keys = await redis.keys('sub:*');
  if (!keys.length) {
    console.log('No subscribers — skipping notifications');
    return;
  }

  let sent = 0;
  for (const key of keys) {
    const sub = await redis.get(key);
    if (!sub) continue;

    const matching = newArticles.filter((a) => sub.sources.includes(a.author));
    for (const article of matching) {
      const payload = JSON.stringify({
        title: article.author,
        body: article.headline,
        data: { url: `/article/${article.id}` },
      });
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 410) {
          await redis.del(key);
        } else {
          console.error(`Push failed for ${key}: ${err.message}`);
        }
      }
    }
  }

  console.log(`Sent ${sent} push notification(s)`);
}

module.exports = { sendNotifications };
```

- [ ] **Step 3: Update `automation/index.js` to collect saved articles and send notifications**

```js
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { fetchItems } = require('./rss');
const { generateArticle } = require('./openrouter');
const { openDb, getExistingTweetIds, saveArticle } = require('./db');
const { sendNotifications } = require('./notify');

async function run() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const db = openDb();
  const existing = getExistingTweetIds(db);

  console.log('Fetching RSS feeds...');
  const items = await fetchItems();
  const newItems = items.filter((i) => !existing.has(i.id));
  console.log(`${items.length} fetched, ${newItems.length} new`);

  const saved = [];
  for (const item of newItems) {
    try {
      console.log(`  Generating: "${item.title}" (${item.author})`);
      const article = await generateArticle(apiKey, item);
      const result = saveArticle(db, {
        tweetId: item.id,
        author: item.author,
        tweetText: item.text,
        tweetUrl: item.url,
        headline: article.headline,
        body: article.body,
        category: article.category,
      });
      if (result) {
        saved.push({ id: result.id, author: item.author, headline: article.headline });
      }
    } catch (err) {
      console.error(`  Failed "${item.title}": ${err.message}`);
    }
  }

  console.log(`Saved ${saved.length} new articles`);

  await sendNotifications(saved);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Commit**

```bash
cd c:\Users\HASSAN\App2\n8n
git add automation/notify.js automation/db.js automation/index.js
git commit -m "feat: send push notifications after new articles saved"
```

---

## Task 8: Push to GitHub + Verify End-to-End

- [ ] **Step 1: Push all commits**

```bash
cd c:\Users\HASSAN\App2\n8n && git push
```

- [ ] **Step 2: Verify Railway deployment succeeds**

Go to Railway → Deployments → confirm green deploy after push.

- [ ] **Step 3: Subscribe on the live site**

Open `https://tweet-blog-production.up.railway.app`:
- Banner appears → click Subscribe → pick sources → Enable Notifications → allow in browser
- Banner shows green subscribed state
- Check Upstash console at console.upstash.com → a `sub:xxxxx` key should be visible

- [ ] **Step 4: Trigger automation manually to test push**

Go to github.com/hassanse10/tweet-blog → Actions → Update Articles → Run workflow.

If new articles are found matching your subscribed sources, a push notification should arrive on your phone within the workflow run time (~7 minutes).

- [ ] **Step 5: Verify expired subscription cleanup**

If a subscription returns HTTP 410 (expired), `notify.js` deletes it from Redis automatically — no action needed.
