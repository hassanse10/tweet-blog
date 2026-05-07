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
