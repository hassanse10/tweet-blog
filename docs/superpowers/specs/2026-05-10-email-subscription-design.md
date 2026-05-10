# Email Subscription — Design Spec
_Date: 2026-05-10_

## Overview

Add an email digest subscription system to AI Digest using Resend. Users can subscribe to receive daily or weekly email digests of AI articles filtered by their preferred sources. This runs alongside the existing browser push notification system — users can use push, email, or both.

---

## UI Placement

The `EmailSubscriptionBanner` component sits directly below the existing `NotificationBanner` in `app/layout.jsx`. The two banners are independent — separate dismiss, separate state.

```
<header>
  <NotificationBanner />   ← existing push notifications
  <EmailSubscriptionBanner />  ← new
</header>
```

---

## Component: EmailSubscriptionBanner

**File:** `app/components/EmailSubscriptionBanner.jsx`

### States

| State | Description |
|---|---|
| `hidden` | User dismissed. Stored in `localStorage` key `email_sub_dismissed`. Never shown again until they unsubscribe. |
| `collapsed` | Default on first visit. Shows: `📧 Get a daily/weekly digest by email` + email input + "Get digest" button. |
| `expanded` | After clicking "Get digest". Shows email input (pre-filled), source picker (6 sources), frequency toggle (Daily / Weekly), "Subscribe" button, "Cancel". |
| `subscribed` | After successful subscribe. Shows: `✓ Email digest: daily · OpenAI, Anthropic` + "Edit" button. |
| `editing` | After clicking "Edit". Same as expanded but shows "Unsubscribe" button and "Save Preferences" instead of "Subscribe". |

### Sources (same 6 as push banner)
`OpenAI`, `Anthropic`, `Google AI`, `DeepMind`, `Meta AI`, `HuggingFace`

Default selected: `OpenAI`, `Anthropic`

### Frequency options
- `daily` — digest sent every day
- `weekly` — digest sent every Monday

### localStorage keys
- `email_sub_dismissed` — `'1'` if dismissed
- `email_sub_address` — stored email (to pre-fill on return visits)
- `email_sub_sources` — JSON array of subscribed sources
- `email_sub_frequency` — `'daily'` or `'weekly'`

---

## API Routes

### `POST /api/subscribe-email`
Subscribe a new email.

**Request body:**
```json
{
  "email": "user@example.com",
  "sources": ["OpenAI", "Anthropic"],
  "frequency": "daily"
}
```

**Validation:**
- `email`: valid email format, max 200 chars
- `sources`: array of 1–20 strings from the allowed sources list
- `frequency`: `"daily"` or `"weekly"`

**On success:** stores to Redis, returns `{ ok: true }`

**Redis key:** `email-sub:<sha256(email)>`
**Redis value:**
```json
{
  "email": "user@example.com",
  "sources": ["OpenAI", "Anthropic"],
  "frequency": "daily",
  "createdAt": "2026-05-10T12:00:00.000Z"
}
```

---

### `PUT /api/subscribe-email`
Update preferences for an existing subscriber.

**Request body:** same as POST

**Behaviour:** returns 404 if subscriber not found, otherwise updates `sources` and `frequency` in Redis.

---

### `DELETE /api/subscribe-email`
Unsubscribe.

**Request body:**
```json
{ "email": "user@example.com" }
```

Deletes the Redis key. Returns `{ ok: true }`.

---

### `POST /api/send-digest`
Triggered by n8n cron. Protected by a shared secret.

**Auth:** request must include header `x-digest-secret: <DIGEST_SECRET env var>`

**Logic:**
1. Scan Redis for all `email-sub:*` keys
2. For each subscriber, check frequency filter:
   - `daily`: always send
   - `weekly`: only send if today is Monday
3. Fetch articles from SQLite created in the last 24h (daily) or 7 days (weekly)
4. Filter articles by subscriber's `sources`
5. If no matching articles: skip (don't send empty email)
6. Send email via Resend with article list

**Response:** `{ sent: N, skipped: M }`

---

## Email Template

Plain but readable HTML email:

- **Subject:** `AI Digest — [date]` (daily) or `AI Digest — Week of [date]` (weekly)
- **Body:** list of articles, each with:
  - Title (linked to article page)
  - Source tag
  - One-line summary
- **Footer:** unsubscribe link pointing to `GET /api/unsubscribe?token=<token>`

### Unsubscribe link
To allow one-click unsubscribe without login, generate a signed token:
`token = base64(email):sha256(email + DIGEST_SECRET)`

`GET /api/unsubscribe?token=<token>` validates and deletes the Redis key.

---

## New Files

| File | Purpose |
|---|---|
| `app/components/EmailSubscriptionBanner.jsx` | UI component |
| `app/api/subscribe-email/route.js` | POST / PUT / DELETE handlers |
| `app/api/send-digest/route.js` | Digest send endpoint (n8n trigger) |
| `app/api/unsubscribe/route.js` | One-click unsubscribe from email |
| `lib/resend.js` | Resend client singleton |

## Modified Files

| File | Change |
|---|---|
| `app/layout.jsx` | Add `<EmailSubscriptionBanner />` below `<NotificationBanner />` |
| `package.json` | Add `resend` dependency |

---

## Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key from resend.com dashboard |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `digest@1minai.site`) |
| `DIGEST_SECRET` | Shared secret for protecting `/api/send-digest` and signing unsubscribe tokens |

---

## n8n Integration

Create a cron workflow in n8n:
- **Daily trigger:** every day at 8:00 AM
- **Weekly trigger:** every Monday at 8:00 AM
- **Action:** HTTP POST to `https://1minai.site/api/send-digest` with header `x-digest-secret`

Both can be a single workflow with a frequency check, or two separate workflows.
