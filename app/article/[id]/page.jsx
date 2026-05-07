import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleById } from '../../../lib/db';
import ArticleImage from '../../components/ArticleImage';
import RatingButtons from '../../components/RatingButtons';

export const dynamic = 'force-dynamic';

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

export default function ArticlePage({ params }) {
  const article = getArticleById(Number(params.id));
  if (!article) notFound();

  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const paragraphs = lines.slice(1).filter(Boolean);
  const mins = readingTime(article.summary);
  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.News;

  return (
    <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* hero image */}
      <ArticleImage
        src={article.image_url}
        author={article.author}
        alt={headline}
        className="h-64"
      />

      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-5 block">
          ← Back to all articles
        </Link>

        {/* meta */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {article.category && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
              {article.category}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">{mins} min read</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{article.author}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(article.created_at)}</span>
        </div>

        {/* headline */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 leading-snug">{headline}</h1>

        {/* body paragraphs */}
        <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* footer actions */}
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
  );
}
