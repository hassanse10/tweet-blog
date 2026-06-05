import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getArticleById, getArticleBySlug, getRelatedArticles } from '../../../lib/db';
import ArticleStack from '../../components/ArticleStack';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const PUBLISHER_LOGO = `${BASE_URL}/icon-192.png`;

function resolveArticle(param) {
  if (/^\d+$/.test(param)) return getArticleById(Number(param));
  return getArticleBySlug(param);
}

export async function generateMetadata({ params }) {
  const article = resolveArticle(params.id);
  if (!article) return {};

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'AI Update';
  const description = lines.slice(1).join(' ').slice(0, 160);
  const canonicalUrl = `${BASE_URL}/article/${article.slug}`;
  const ogImageUrl = article.image_url
    ? article.image_url
    : `${BASE_URL}/og?title=${encodeURIComponent(headline)}&category=${encodeURIComponent(article.category || '')}`;

  const wordCount = article.summary.split(/\s+/).length;

  return {
    title: `${headline} | 1minAi`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    ...(wordCount < 120 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: headline,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: new Date(article.created_at).toISOString(),
      modifiedTime: new Date(article.created_at).toISOString(),
      authors: [article.author],
      siteName: '1minAi',
      locale: 'en_US',
      ...(article.category && { section: article.category }),
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: headline }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@1minai',
      title: headline,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ArticlePage({ params }) {
  const param = params.id;
  const article = resolveArticle(param);
  if (!article) notFound();

  // Redirect numeric IDs and mismatched slugs to canonical slug URL
  if (/^\d+$/.test(param) || param !== article.slug) {
    permanentRedirect(`/article/${article.slug}`);
  }

  const related = getRelatedArticles(article.id, article.category, 3);

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const description = lines.slice(1).join(' ').slice(0, 160);
  const canonicalUrl = `${BASE_URL}/article/${article.slug}`;
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    author: { '@type': 'Organization', name: article.author },
    datePublished: new Date(article.created_at).toISOString(),
    dateModified: new Date(article.created_at).toISOString(),
    publisher: {
      '@type': 'Organization',
      name: '1minAi',
      logo: { '@type': 'ImageObject', url: PUBLISHER_LOGO },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    ...(article.image_url && { image: article.image_url }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      ...(article.category
        ? [{ '@type': 'ListItem', position: 2, name: article.category, item: `${BASE_URL}/topic/${article.category.toLowerCase()}` }]
        : []),
      { '@type': 'ListItem', position: article.category ? 3 : 2, name: headline, item: canonicalUrl },
    ],
  };

  const faqJsonLd = faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  const videoJsonLd = article.youtube_video_id ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: headline,
    description,
    embedUrl: `https://www.youtube.com/embed/${article.youtube_video_id}`,
    thumbnailUrl: `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`,
    uploadDate: article.created_at,
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      {videoJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />}

      <div className="page-pad" style={{ paddingTop: 20, paddingBottom: 8 }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-secondary)', transition: 'border-color 0.15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          Back
        </Link>
      </div>

<ArticleStack initialArticle={article} initialRelated={related} />
    </>
  );
}
