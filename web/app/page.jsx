import Link from 'next/link';
import { Suspense } from 'react';
import { searchArticles, getDistinctSources } from '../lib/db';
import ArticleImage from './components/ArticleImage';
import FilterBar from './components/FilterBar';

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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HomePage({ searchParams }) {
  const q        = searchParams?.q        || '';
  const source   = searchParams?.source   || '';
  const category = searchParams?.category || '';
  const page     = Math.max(1, parseInt(searchParams?.page || '1', 10));

  const { articles, total, pages } = searchArticles({ q, source, category, page, limit: 20 });
  const sources = getDistinctSources();

  const buildUrl = (overrides) => {
    const p = { ...(q && { q }), ...(source && { source }), ...(category && { category }), page, ...overrides };
    const qs = Object.entries(p)
      .filter(([k, v]) => k === 'page' ? Number(v) > 1 : Boolean(v))
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return qs ? `/?${qs}` : '/';
  };

  return (
    <div className="space-y-6">
      {/* filters */}
      <Suspense>
        <FilterBar sources={sources} />
      </Suspense>

      {/* results info */}
      {(q || source || category) && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total} result{total !== 1 ? 's' : ''}
          {q && <> for <span className="font-medium text-gray-800 dark:text-gray-200">"{q}"</span></>}
          {source && <> from <span className="font-medium text-gray-800 dark:text-gray-200">{source}</span></>}
          {category && <> in <span className="font-medium text-gray-800 dark:text-gray-200">{category}</span></>}
        </p>
      )}

      {/* empty state */}
      {articles.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-16">
          {q || source || category ? 'No articles match your filters.' : 'No articles yet. Run the automation to get started.'}
        </p>
      )}

      {/* magazine grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {articles.map((article) => {
          const lines = article.summary.split('\n').filter(Boolean);
          const headline = lines[0] || 'Untitled';
          const excerpt = lines.slice(1).join(' ').slice(0, 140);
          const mins = readingTime(article.summary);
          const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.News;

          return (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition flex flex-col"
            >
              <ArticleImage
                src={article.image_url}
                author={article.author}
                alt={headline}
                className="h-44 flex-shrink-0"
              />
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {article.category && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                      {article.category}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{mins} min read</span>
                </div>
                <h2 className="text-sm font-semibold leading-snug mb-1 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {headline}
                </h2>
                {excerpt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{excerpt}</p>
                )}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">
                  {article.author} · {formatDate(article.created_at)}
                  {article.rating > 0 && <> · 👍 {article.rating}</>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {page > 1 ? (
            <Link
              href={buildUrl({ page: page - 1 })}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
            >
              ← Prev
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm text-gray-300 dark:text-gray-600">← Prev</span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={buildUrl({ page: page + 1 })}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
            >
              Next →
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm text-gray-300 dark:text-gray-600">Next →</span>
          )}
        </div>
      )}
    </div>
  );
}
