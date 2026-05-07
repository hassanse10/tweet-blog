'use strict';

async function searchYouTube(apiKey, query) {
  if (!apiKey) return null;

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '1',
    relevanceLanguage: 'en',
    key: apiKey,
  });

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!res.ok) {
      console.error(`YouTube API error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.items?.[0]?.id?.videoId || null;
  } catch (err) {
    console.error(`YouTube search failed: ${err.message}`);
    return null;
  }
}

module.exports = { searchYouTube };
