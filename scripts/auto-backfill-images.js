'use strict';

const API = 'https://1minai.site/api/fetch-images';
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function run() {
  let round = 1;

  while (true) {
    console.log(`[${new Date().toISOString()}] Round ${round} — calling ${API}`);

    try {
      const res = await fetch(API, { method: 'POST' });
      const data = await res.json();
      console.log(`  updated: ${data.updated}, total checked: ${data.total}`);

      if (data.message === 'No articles need images' || data.total === 0) {
        console.log('All articles have images. Done.');
        process.exit(0);
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }

    round++;
    console.log(`  Waiting 1 hour before next run…\n`);
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
}

run();
