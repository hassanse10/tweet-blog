const BASE_URL = 'https://1minai.site';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
