'use strict';

// Key words that must appear in video title to pass relevance check
function isRelevant(videoTitle, headline) {
  const titleWords = videoTitle.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const headlineWords = headline.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const matches = headlineWords.filter((w) => titleWords.includes(w));
  // At least 2 meaningful words must overlap
  return matches.length >= 2;
}

async function searchYouTube(apiKey, headline, author) {
  if (!apiKey) return null;

  // Anchor query with source company + topic for precision
  const query = author ? `${author} ${headline}` : headline;

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '5',              // fetch top 5, pick first relevant one
    relevanceLanguage: 'en',
    videoCategoryId: '28',        // Science & Technology
    key: apiKey,
  });

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!res.ok) {
      console.error(`YouTube API error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data.items?.length) return null;

    // Return first video whose title is relevant to the headline
    for (const item of data.items) {
      const videoId = item.id?.videoId;
      const videoTitle = item.snippet?.title || '';
      if (videoId && isRelevant(videoTitle, headline)) {
        return videoId;
      }
    }

    return null; // no relevant video found
  } catch (err) {
    console.error(`YouTube search failed: ${err.message}`);
    return null;
  }
}

module.exports = { searchYouTube };
