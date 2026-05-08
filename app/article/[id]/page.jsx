import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleById, getRelatedArticles } from '../../../lib/db';
import ArticleStack from '../../components/ArticleStack';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';

export async function generateMetadata({ params }) {
  const article = getArticleById(Number(params.id));
  if (!article) return {};

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'AI Update';
  const description = lines.slice(1).join(' ').slice(0, 160);

  return {
    title: `${headline} | AI Digest`,
    description,
    alternates: { canonical: `${BASE_URL}/article/${params.id}` },
    openGraph: {
      title: headline,
      description,
      type: 'article',
      publishedTime: article.created_at,
      authors: [article.author],
      images: article.image_url ? [{ url: article.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: headline,
      description,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export default function ArticlePage({ params }) {
  const article = getArticleById(Number(params.id));
  if (!article) notFound();

  const related = getRelatedArticles(article.id, article.category, 3);

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const description = lines.slice(1).join(' ').slice(0, 160);

  // JSON-LD schemas
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: { '@type': 'Organization', name: article.author },
    datePublished: article.created_at,
    publisher: { '@type': 'Organization', name: 'AI Digest' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/article/${article.id}` },
    ...(article.image_url && { image: article.image_url }),
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
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      {videoJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />}

      <div className="mb-4">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to all articles
        </Link>
      </div>

      <ArticleStack initialArticle={article} initialRelated={related} />
    </>
  );
}
