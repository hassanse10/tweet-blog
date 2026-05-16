import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getArticleById, getArticleBySlug, getRelatedArticles } from '../../../lib/db';
import ArticleStack from '../../components/ArticleStack';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const PUBLISHER_LOGO = `${BASE_URL}/icon.png`;

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

  return {
    title: `${headline} | 1minAi`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: headline,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.created_at,
      modifiedTime: article.created_at,
      authors: [article.author],
      siteName: '1minAi',
      images: article.image_url ? [{ url: article.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@1minai',
      title: headline,
      description,
      images: article.image_url ? [article.image_url] : [],
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
    '@type': 'Article',
    headline,
    description,
    author: { '@type': 'Organization', name: article.author },
    datePublished: article.created_at,
    dateModified: article.created_at,
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
    embedUrl: `https://www.youtube.com/embed/${article.youtube_video_id}`,
    thumbnailUrl: `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`,
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      {videoJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />}

      <div className="mb-4 page-pad" style={{ paddingTop: 20 }}>
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to all articles
        </Link>
      </div>

      <ArticleStack initialArticle={article} initialRelated={related} />
    </>
  );
}
