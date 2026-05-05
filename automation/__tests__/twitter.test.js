'use strict';

const { fetchTweets } = require('../twitter');

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('fetchTweets', () => {
  const BEARER_TOKEN = 'test-bearer-token';

  const mockApiResponse = {
    data: [
      { id: '111', author_id: 'u1', text: 'Hello from OpenAI', created_at: '2024-01-01T00:00:00Z' },
      { id: '222', author_id: 'u2', text: 'Hello from Anthropic', created_at: '2024-01-02T00:00:00Z' },
    ],
    includes: {
      users: [
        { id: 'u1', username: 'OpenAI' },
        { id: 'u2', username: 'AnthropicAI' },
      ],
    },
  };

  test('1. parses tweets and resolves usernames from includes.users', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const tweets = await fetchTweets(BEARER_TOKEN);

    expect(tweets).toHaveLength(2);
    expect(tweets[0]).toEqual({
      tweetId: '111',
      authorId: 'u1',
      author: 'OpenAI',
      text: 'Hello from OpenAI',
      createdAt: '2024-01-01T00:00:00Z',
      tweetUrl: 'https://twitter.com/OpenAI/status/111',
    });
    expect(tweets[1]).toEqual({
      tweetId: '222',
      authorId: 'u2',
      author: 'AnthropicAI',
      text: 'Hello from Anthropic',
      createdAt: '2024-01-02T00:00:00Z',
      tweetUrl: 'https://twitter.com/AnthropicAI/status/222',
    });
  });

  test('2. returns empty array when API returns no data field', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ meta: { result_count: 0 } }),
    });

    const tweets = await fetchTweets(BEARER_TOKEN);
    expect(tweets).toEqual([]);
  });

  test('3. throws "Twitter API error: 401" on non-ok response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(fetchTweets(BEARER_TOKEN)).rejects.toThrow('Twitter API error: 401');
  });

  test('4. uses Bearer token in Authorization header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    await fetchTweets(BEARER_TOKEN);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe(`Bearer ${BEARER_TOKEN}`);
    expect(url).toContain('https://api.twitter.com/2/tweets/search/recent');
  });
});
