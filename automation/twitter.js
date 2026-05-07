'use strict';

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets/search/recent';
const QUERY = '(from:OpenAI OR from:AnthropicAI OR from:GoogleDeepMind OR from:MetaAI)';

async function fetchTweets(bearerToken) {
  const params = new URLSearchParams({
    query: QUERY,
    max_results: '20',
    'tweet.fields': 'created_at,author_id,text',
    expansions: 'author_id',
    'user.fields': 'username',
  });

  const url = `${TWITTER_API_URL}?${params}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  if (!body.data) return [];

  const userMap = {};
  if (body.includes && body.includes.users) {
    for (const user of body.includes.users) {
      userMap[user.id] = user.username;
    }
  }

  return body.data.map((tweet) => {
    const author = userMap[tweet.author_id] || tweet.author_id;
    return {
      tweetId: tweet.id,
      authorId: tweet.author_id,
      author,
      text: tweet.text,
      createdAt: tweet.created_at,
      tweetUrl: `https://twitter.com/${author}/status/${tweet.id}`,
    };
  });
}

module.exports = { fetchTweets };
