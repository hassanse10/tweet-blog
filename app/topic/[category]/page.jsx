import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchArticles } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const VALID_CATEGORIES = ['AI', 'Research', 'Product', 'Policy', 'Safety', 'Business', 'News', 'Other'];

const CAT_COLOR = {
  Research: 'var(--cat-research)',
  Product:  'var(--cat-product)',
  Safety:   'var(--cat-safety)',
  Business: 'var(--cat-business)',
  News:     'var(--cat-news)',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function readingTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

export async function generateMetadata({ params }) {
  const category = decodeURIComponent(params.category);
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${label} — 1minAi`,
    description: `Latest ${label} news from OpenAI, Anthropic, Google and more — summarized in minutes.`,
    alternates: { canonical: `${BASE_URL}/topic/${category}` },
  };
}

export default function TopicPage({ params, searchParams }) {
  const raw = decodeURIComponent(params.category);
  const category = VALID_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (!category) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const { articles, total, pages } = searchArticles({ category, page, limit: 21 });
  const catColor = CAT_COLOR[category] || 'var(--accent)';

  return (
    <div className="page-pad" style={{ padding: '48px 56px' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <Link href="/" className="aid-kicker" style={{ color: 'var(--accent)', marginBottom: 20, display: 'inline-block' }}>
          ← All articles
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <span className="cat-dot" style={{ background: catColor, width: 10, height: 10 }} />
          <h1 className="aid-display topic-h1" style={{ fontSize: 48, margin: 0 }}>{category}</h1>
        </div>
        <p className="aid-meta" style={{ marginTop: 12 }}>{total} articles</p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 48 }} />

      {/* Grid */}
      {articles.length === 0 ? (
        <p className="aid-kicker" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px 0' }}>
          No articles in this category yet.
        </p>
      ) : (
        <div className="article-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {articles.map((a) => {
            const headline = a.summary.split('\n').find(Boolean) || 'Article';
            const excerpt  = a.summary.split('\n').filter(Boolean).slice(1).join(' ').slice(0, 110);
            const mins     = readingTime(a.summary);
            return (
              <Link key={a.id} href={`/article/${a.slug}`} className="card-lift" style={{
                display: 'block',
                background: 'var(--bg-card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 22px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <span className="cat-dot" style={{ background: catColor }} />
                    <span className="aid-kicker" style={{ color: catColor }}>{category}</span>
                    <span className="aid-kicker" style={{ color: 'var(--text-muted)' }}>/</span>
                    <span className="aid-kicker">{a.author}</span>
                  </div>
                  <p className="card-headline" style={{
                    fontSize: 17, fontWeight: 600, lineHeight: 1.3,
                    color: 'var(--text-primary)', margin: '0 0 10px',
                    transition: 'color 0.2s',
                  }}>{headline}</p>
                  {excerpt && (
                    <p style={{
                      fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)',
                      margin: '0 0 14px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{excerpt}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="aid-meta">
                    <span>{formatDate(a.created_at)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--accent-bright)' }}>{mins} min</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 56 }}>
          {page > 1 && (
            <Link href={`/topic/${params.category}?page=${page - 1}`} style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
            }}>← Previous</Link>
          )}
          <span className="aid-meta" style={{ padding: '9px 16px' }}>Page {page} of {pages}</span>
          {page < pages && (
            <Link href={`/topic/${params.category}?page=${page + 1}`} style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
            }}>Next →</Link>
          )}
        </div>
      )}
    </div>
  );
}
