'use strict';

const { generateArticle } = require('../openrouter');

beforeEach(() => {
  global.fetch = jest.fn();
});

const fakeTweet = { author: 'elonmusk', text: 'Rockets are cool.' };
const fakeApiKey = 'test-api-key';

test('returns article text string from API response', async () => {
  const articleText = 'Rockets Are Cool\n\nElon Musk says rockets are cool and that matters.';
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: articleText } }]
    })
  });

  const result = await generateArticle(fakeApiKey, fakeTweet);
  expect(result).toBe(articleText);
});

test('throws "OpenRouter API error: 429" on non-ok response', async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    status: 429,
    json: async () => ({})
  });

  await expect(generateArticle(fakeApiKey, fakeTweet))
    .rejects
    .toThrow('OpenRouter API error: 429');
});

test('sends correct model and includes tweet author + text in user prompt body', async () => {
  const articleText = 'Test headline\n\nTest body.';
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: articleText } }]
    })
  });

  await generateArticle(fakeApiKey, fakeTweet);

  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = global.fetch.mock.calls[0];

  expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');

  const body = JSON.parse(options.body);
  expect(body.model).toBe('anthropic/claude-3.5-sonnet');

  const userMessage = body.messages.find(m => m.role === 'user');
  expect(userMessage.content).toContain(fakeTweet.author);
  expect(userMessage.content).toContain(fakeTweet.text);
});
