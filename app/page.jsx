import Link from 'next/link';
import { Suspense } from 'react';
import { searchArticles, getDistinctSources } from '../lib/db';
import ArticleImage from './components/ArticleImage';
import FilterBar from './components/FilterBar';

export const dynamic = 'force-dynamic';

const CAT_COLOR = {
  Research: 'var(--cat-research)',
  Product:  'var(--cat-product)',
  Safety:   'var(--cat-safety)',
  Business: 'var(--cat-business)',
  News:     'var(--cat-news)',
};

function readingTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMasthead() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  return `${day} · ${date}`;
}

/* ── Kicker: colored dot + category + source ── */
function Kicker({ category, author }) {
  const color = CAT_COLOR[category] || 'var(--text-tertiary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span className="cat-dot" style={{ background: color }} />
      <span className="aid-kicker" style={{ color }}>{category || 'News'}</span>
      {author && (
        <>
          <span className="aid-kicker" style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="aid-kicker">{author}</span>
        </>
      )}
    </div>
  );
}

/* ── Hero card (large, left column) ── */
function HeroCard({ article }) {
  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const excerpt = lines.slice(1).join(' ').slice(0, 180);
  const mins = readingTime(article.summary);
  const hasVideo = /^[a-zA-Z0-9_-]{11}$/.test(article.youtube_video_id);

  return (
    <Link href={`/article/${article.slug}`} className="card-lift" style={{ display: 'block' }}>
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24, aspectRatio: '16/10', position: 'relative' }}>
        <ArticleImage src={article.image_url} author={article.author} alt={headline}
          className="w-full h-full object-cover" />
        {hasVideo && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'rgba(239,68,68,0.9)', borderRadius: 6,
            padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            <span style={{ fontSize: 11, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>VIDEO</span>
          </div>
        )}
      </div>
      <Kicker category={article.category} author={article.author} />
      <h2 className="aid-display card-headline" style={{
        fontSize: 46, margin: '0 0 16px',
        color: 'var(--text-primary)',
        transition: 'color 0.2s ease',
        lineHeight: 1.02,
      }}>
        {headline}
      </h2>
      {excerpt && (
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px', maxWidth: 560 }}>
          {excerpt}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="aid-meta">
        <span>{article.author}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>{formatDate(article.created_at)}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: 'var(--accent-bright)' }}>{mins} min read</span>
      </div>
    </Link>
  );
}

/* ── Featured card (right column, stacked 2) ── */
function FeaturedCard({ article }) {
  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const excerpt = lines.slice(1).join(' ').slice(0, 110);
  const mins = readingTime(article.summary);

  return (
    <Link href={`/article/${article.slug}`} className="card-lift" style={{
      display: 'block', padding: '20px 0',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', flexShrink: 0 }}>
          <ArticleImage src={article.image_url} author={article.author} alt={headline}
            className="w-full h-full object-cover" />
        </div>
        <div>
          <Kicker category={article.category} author={article.author} />
          <h3 className="aid-display card-headline" style={{
            fontSize: 22, margin: '0 0 8px', lineHeight: 1.1,
            color: 'var(--text-primary)', transition: 'color 0.2s ease',
          }}>
            {headline}
          </h3>
          {excerpt && (
            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
              {excerpt}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10 }} className="aid-meta">
            <span>{formatDate(article.created_at)}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--accent-bright)' }}>{mins} min</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Grid card (3-col) ── */
function GridCard({ article }) {
  const lines = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const excerpt = lines.slice(1).join(' ').slice(0, 100);
  const mins = readingTime(article.summary);
  const hasVideo = /^[a-zA-Z0-9_-]{11}$/.test(article.youtube_video_id);

  return (
    <Link href={`/article/${article.slug}`} className="card-lift" style={{
      display: 'block',
      background: 'var(--bg-card)',
      borderRadius: 12,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease, transform 0.25s ease',
    }}>
      <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
        <ArticleImage src={article.image_url} author={article.author} alt={headline}
          className="w-full h-full object-cover" />
        {hasVideo && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(239,68,68,0.9)', borderRadius: 5,
            padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            <span style={{ fontSize: 10, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>VIDEO</span>
          </div>
        )}
      </div>
      <div style={{ padding: '18px 20px 20px' }}>
        <Kicker category={article.category} author={article.author} />
        <h3 className="aid-display card-headline" style={{
          fontSize: 22, margin: '0 0 10px', lineHeight: 1.1,
          color: 'var(--text-primary)', transition: 'color 0.2s ease',
        }}>
          {headline}
        </h3>
        {excerpt && (
          <p style={{
            fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)',
            margin: '0 0 14px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {excerpt}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="aid-meta">
          <span>{article.author}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>{formatDate(article.created_at)}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--accent-bright)' }}>{mins} min</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage({ searchParams }) {
  const q        = searchParams?.q        || '';
  const source   = searchParams?.source   || '';
  const category = searchParams?.category || '';
  const page     = Math.max(1, parseInt(searchParams?.page || '1', 10));

  const { articles, total, pages } = searchArticles({ q, source, category, page, limit: 21 });
  const sources = getDistinctSources();

  const buildUrl = (overrides) => {
    const p = { ...(q && { q }), ...(source && { source }), ...(category && { category }), page, ...overrides };
    const qs = Object.entries(p)
      .filter(([k, v]) => k === 'page' ? Number(v) > 1 : Boolean(v))
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return qs ? `/?${qs}` : '/';
  };

  const isFiltered = q || source || category;
  const [hero, ...rest] = articles;
  const featured = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <div>
      {/* ── Masthead ── */}
      <div style={{ padding: '48px 56px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, marginBottom: 32 }}>
          <div>
            <p className="aid-kicker" style={{ marginBottom: 10, letterSpacing: '0.16em' }}>
              {formatMasthead()}
            </p>
            <h1 className="aid-display" style={{ fontSize: 56, margin: 0, lineHeight: 1 }}>
              Today in <em style={{ fontStyle: 'italic' }}>AI</em>.
            </h1>
          </div>
          <div style={{ flex: 1 }} />
          {!isFiltered && total > 0 && (
            <div style={{ paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="aid-kicker">{total} articles</span>
              <span style={{ width: 1, height: 14, background: 'var(--border-strong)', display: 'inline-block' }} />
              <span className="aid-kicker">≈ {total} min total</span>
            </div>
          )}
        </div>

        {/* ── Filter bar ── */}
        <Suspense>
          <FilterBar sources={sources} />
        </Suspense>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '32px 56px 0' }} />

      {/* ── Filtered results info ── */}
      {isFiltered && (
        <p className="aid-meta" style={{ padding: '24px 56px 0' }}>
          {total} result{total !== 1 ? 's' : ''}
          {q && <> for <strong style={{ color: 'var(--text-primary)' }}>"{q}"</strong></>}
          {source && <> from <strong style={{ color: 'var(--text-primary)' }}>{source}</strong></>}
          {category && <> in <strong style={{ color: 'var(--text-primary)' }}>{category}</strong></>}
        </p>
      )}

      {/* ── Empty state ── */}
      {articles.length === 0 && (
        <div style={{ padding: '120px 56px', textAlign: 'center' }}>
          <p className="aid-kicker" style={{ color: 'var(--text-muted)' }}>
            {isFiltered ? 'No articles match your filters.' : 'No articles yet. Run the automation to get started.'}
          </p>
        </div>
      )}

      {/* ── Hero + Featured row ── */}
      {hero && (
        <div style={{ padding: '48px 56px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56 }}>
            {/* Hero */}
            <HeroCard article={hero} />

            {/* Featured stack */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {featured.map((a) => (
                <FeaturedCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 3-col grid ── */}
      {grid.length > 0 && (
        <div style={{ padding: '48px 56px 0' }}>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 48 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {grid.map((article) => (
              <GridCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div style={{
          padding: '56px 56px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {page > 1 ? (
            <Link href={buildUrl({ page: page - 1 })} style={{
              padding: '10px 20px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              transition: 'border-color 0.2s',
            }}>
              ← Prev
            </Link>
          ) : (
            <span style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: 13 }}>← Prev</span>
          )}
          <span className="aid-meta" style={{ padding: '0 12px' }}>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={buildUrl({ page: page + 1 })} style={{
              padding: '10px 20px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              transition: 'border-color 0.2s',
            }}>
              Next →
            </Link>
          ) : (
            <span style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: 13 }}>Next →</span>
          )}
        </div>
      )}
    </div>
  );
}
