import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchArticles } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';

const VALID_CATEGORIES = ['AI', 'Research', 'Product', 'Policy', 'Other'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function generateMetadata({ params }) {
  const category = decodeURIComponent(params.category);
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${label} — AI Digest`,
    description: `Latest ${label} news from OpenAI, Anthropic, Google and more — summarized in minutes.`,
    alternates: { canonical: `${BASE_URL}/topic/${category}` },
    openGraph: {
      title: `${label} — AI Digest`,
      description: `Browse the latest ${label} news from OpenAI, Anthropic, Google and more.`,
    },
  };
}

export default function TopicPage({ params, searchParams }) {
  const raw = decodeURIComponent(params.category);
  // Match case-insensitively to a valid category
  const category = VALID_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (!category) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const { articles, total, pages } = searchArticles({ category, page, limit: 20 });

  const label = category;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 block">
          ← All articles
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{label}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{total} articles</p>
      </div>

      {/* Article grid */}
      {articles.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No articles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map((a) => {
            const headline = a.summary.split('\n').find(Boolean) || 'Article';
            const excerpt = a.summary.split('\n').filter(Boolean).slice(1).join(' ').slice(0, 120);
            return (
              <Link
                key={a.id}
                href={`/article/${a.slug}`}
                className="block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">{headline}</p>
                {excerpt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{excerpt}</p>
                )}
                <p className="text-xs text-gray-400">{a.author} · {formatDate(a.created_at)}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link href={`/topic/${params.category}?page=${page - 1}`}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors">
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={`/topic/${params.category}?page=${page + 1}`}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
