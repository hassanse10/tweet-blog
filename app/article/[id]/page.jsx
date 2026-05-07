import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleById, getRelatedArticles } from '../../../lib/db';
import ArticleImage from '../../components/ArticleImage';
import RatingButtons from '../../components/RatingButtons';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://tweet-blog-production.up.railway.app';

const CATEGORY_COLORS = {
  Research: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Product:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Safety:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Business: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  News:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function readingTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const description = lines.slice(1).join(' ').slice(0, 160);

  let sections = [];
  let faqs = [];
  try { sections = article.sections ? JSON.parse(article.sections) : []; } catch {}
  try { faqs = article.faqs ? JSON.parse(article.faqs) : []; } catch {}

  // Fallback for old articles without sections
  const paragraphs = sections.length ? [] : lines.slice(1).filter(Boolean);

  const mins = readingTime(article.summary);
  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.News;
  const related = getRelatedArticles(article.id, article.category, 3);

  // JSON-LD schemas
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

  const showToc = sections.length > 1 || faqs.length > 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      {videoJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />}

      <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ArticleImage src={article.image_url} author={article.author} alt={headline} className="h-64" />

        <div className="p-6 max-w-2xl mx-auto">
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-5 block">
            ← Back to all articles
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {article.category && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                {article.category}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              <time dateTime={article.created_at}>{formatDate(article.created_at)}</time>
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{article.author}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{mins} min read</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 leading-snug">{headline}</h1>

          {/* Table of Contents */}
          {showToc && (
            <nav aria-label="Table of contents" className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Contents</p>
              <ol className="space-y-1 list-none">
                {sections.map((s, i) => (
                  <li key={i}>
                    <a href={`#${toSlug(s.heading)}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {i + 1}. {s.heading}
                    </a>
                  </li>
                ))}
                {faqs.length > 0 && (
                  <li>
                    <a href="#faq" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {sections.length + 1}. Frequently Asked Questions
                    </a>
                  </li>
                )}
              </ol>
            </nav>
          )}

          {/* Article body */}
          {sections.length > 0 ? (
            <div className="space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {sections.map((s, i) => (
                <section key={i}>
                  <h2 id={toSlug(s.heading)} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 scroll-mt-20">
                    {s.heading}
                  </h2>
                  <p>{s.body}</p>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}

          {/* YouTube embed */}
          {article.youtube_video_id && (
            <div className="mt-8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Related Video</h2>
              <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${article.youtube_video_id}`}
                  title={headline}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <div id="faq" className="mt-8 scroll-mt-20">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-2">
                {faqs.map((f, i) => (
                  <details key={i} className="group border border-gray-200 dark:border-gray-700 rounded-lg">
                    <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100 list-none">
                      {f.question}
                      <span className="ml-2 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-200">▾</span>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Related articles (internal links) */}
          {related.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Related Articles</h2>
              <div className="space-y-2">
                {related.map((r) => {
                  const rHeadline = r.summary.split('\n').find(Boolean) || 'Article';
                  return (
                    <Link
                      key={r.id}
                      href={`/article/${r.id}`}
                      className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{rHeadline}</p>
                      <p className="text-xs text-gray-400 mt-1">{r.author} · {formatDate(r.created_at)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <RatingButtons articleId={article.id} initialRating={article.rating} />
            <a
              href={article.tweet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Read original post →
            </a>
          </div>
        </div>
      </article>
    </>
  );
}
