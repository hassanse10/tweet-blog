import { notFound } from 'next/navigation';
import { getArticleBySlug, getTranslation } from '../../../../lib/db';
import TranslatedArticle from '../../../components/TranslatedArticle';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const SUPPORTED_LANGS = ['es', 'fr'];
const LANG_LABELS = { es: 'Español', fr: 'Français' };
const LANG_LOCALE = { es: 'es_ES', fr: 'fr_FR' };

export async function generateMetadata({ params }) {
  const { lang, slug } = params;
  if (!SUPPORTED_LANGS.includes(lang)) return {};

  const article = getArticleBySlug(slug);
  if (!article) return {};

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'AI Update';
  const canonicalUrl = `${BASE_URL}/article/${slug}`;
  const translatedUrl = `${BASE_URL}/${lang}/article/${slug}`;
  const ogImage = article.image_url || `${BASE_URL}/og?title=${encodeURIComponent(headline)}&category=${encodeURIComponent(article.category || '')}`;

  return {
    title: `${headline} | 1minAi`,
    alternates: {
      canonical: translatedUrl,
      languages: {
        'en': canonicalUrl,
        [lang]: translatedUrl,
      },
    },
    openGraph: {
      title: headline,
      url: translatedUrl,
      siteName: '1minAi',
      type: 'article',
      locale: LANG_LOCALE[lang],
      images: [{ url: ogImage, width: 1200, height: 630, alt: headline }],
    },
  };
}

export default function TranslatedArticlePage({ params }) {
  const { lang, slug } = params;
  if (!SUPPORTED_LANGS.includes(lang)) notFound();

  const article = getArticleBySlug(slug);
  if (!article) notFound();

  // Serve cached translation immediately if available, else client fetches it
  const cachedTranslation = getTranslation(article.id, lang);

  return (
    <TranslatedArticle
      article={article}
      lang={lang}
      langLabel={LANG_LABELS[lang]}
      cachedTranslation={cachedTranslation}
    />
  );
}
