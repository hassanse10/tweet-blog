# Web Push Notifications — Design Spec

## Context

The AI Digest app fetches articles from AI company RSS feeds every 6 hours and deploys them to Railway. Users want to be notified on their phones when new articles arrive from their favourite sources. This spec describes the Web Push notification system with per-source filtering.

---

## Architecture

```
Browser                  Next.js (Railway)        GitHub Actions         Upstash Redis
──────────────────────────────────────────────────────────────────────────────────────
User subscribes
  → SW registers
  → POST /api/subscribe  → save subscription   →  sub:{hash} = {...}

User updates prefs
  → PUT /api/subscribe   → update sources      →  sub:{hash}.sources = [...]

                                                 Automation runs
                                                 → new articles saved
                                                 → fetch all subs       ← Upstash
                                                 → send push per sub
                                                   filtered by source
                                                 → commit DB → push
                                                              → Railway redeploys
```

---

## UI — Notification Banner

Placed directly below the sticky header. Three states:

**State 1 — Collapsed (first visit, not yet subscribed)**
- Strip: "🔔 Get notified when new AI articles drop" + Subscribe button + ✕ dismiss
- Dismissed state stored in `localStorage` — won't reappear if dismissed

**State 2 — Expanded (after clicking Subscribe)**
- Banner expands inline to show pill-style source toggles (all 6 sources)
- Sources: OpenAI, Anthropic, Google AI, DeepMind, Meta AI, HuggingFace
- At least one source must be selected to enable the "Enable Notifications →" button
- Clicking "Enable Notifications" triggers browser permission prompt, then saves subscription

**State 3 — Subscribed (returning user)**
- Shows "🔔 Subscribed: [source pills]" + "Edit" link
- Clicking Edit re-expands inline source picker to update preferences

---

## Data Model (Upstash Redis)

```
Key:   sub:{sha256(endpoint)}
Value: JSON string {
  endpoint:  string,            // push subscription endpoint URL
  keys: {
    p256dh:  string,
    auth:    string
  },
  sources:   string[],          // e.g. ["OpenAI", "Anthropic"]
  createdAt: ISO string
}
```

Subscriptions are scanned in full on each automation run (volume expected to remain small).

---

## Push Notification Format

```
title:  "{source}"                          e.g. "OpenAI"
body:   "{article headline}"
icon:   "/icon-192.png"                      // 192×192 PNG, created during implementation
data:   { url: "/article/{id}" }            clicking opens the article
```

---

## New Files

| File | Purpose |
|------|---------|
| `public/sw.js` | Service worker — handles push events, shows notification, handles click |
| `app/components/NotificationBanner.jsx` | Banner component with all 3 states |
| `app/api/vapid-key/route.js` | Returns VAPID public key |
| `app/api/subscribe/route.js` | POST / PUT / DELETE subscription management |
| `automation/notify.js` | Reads Upstash subscriptions, sends pushes after new articles saved |

---

## Modified Files

| File | Change |
|------|--------|
| `app/layout.jsx` | Add `<NotificationBanner>` below header |
| `automation/index.js` | Call `notify(newArticles)` after saving |

---

## Environment Variables

| Variable | Where needed |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Railway + GitHub secret |
| `VAPID_PRIVATE_KEY` | Railway + GitHub secret |
| `VAPID_CONTACT_EMAIL` | Railway + GitHub secret |
| `UPSTASH_REDIS_REST_URL` | Railway + GitHub secret |
| `UPSTASH_REDIS_REST_TOKEN` | Railway + GitHub secret |

Generated once with `npx web-push generate-vapid-keys`.

---

## New Dependencies

| Package | Used in |
|---------|---------|
| `web-push` | automation/notify.js (send pushes) |
| `@upstash/redis` | api/subscribe + automation/notify.js |

---

## Verification

1. Run `npx web-push generate-vapid-keys` — confirm keys generated
2. Add env vars to Railway and GitHub secrets
3. Open site locally → banner appears → expand → select sources → click Enable → browser asks permission → allow
4. Check Upstash dashboard — subscription key appears
5. Run `node automation/index.js` locally — confirm push notification arrives on phone
6. Trigger GitHub Actions manually — confirm notification delivered and DB committed
