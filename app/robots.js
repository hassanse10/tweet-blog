const BASE_URL = 'https://1minai.site';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-articles.xml`,
      `${BASE_URL}/sitemap-topics.xml`,
      `${BASE_URL}/sitemap-static.xml`,
    ],
  };
}
