'use client';

import Link from 'next/link';

const CAT_COLOR = {
  Research: 'var(--cat-research)',
  Product:  'var(--cat-product)',
  Safety:   'var(--cat-safety)',
  Business: 'var(--cat-business)',
  News:     'var(--cat-news)',
};

export default function NewsTicker({ items }) {
  if (!items?.length) return null;

  // Duplicate for seamless infinite loop
  const doubled = [...items, ...items];

  return (
    <div style={{
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border)',
      height: 38,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* LIVE badge */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 20px',
        height: '100%',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        zIndex: 2,
      }}>
        <span className="live-dot" />
        <span className="aid-kicker" style={{ color: 'var(--text-primary)', letterSpacing: '0.18em' }}>LIVE</span>
      </div>

      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 93, top: 0, bottom: 0, width: 40, zIndex: 1,
        background: 'linear-gradient(to right, var(--bg-deep), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Scrolling track */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <Link
              key={i}
              href={`/article/${item.slug}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '0 28px',
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                transition: 'color 0.15s',
              }}
            >
              {/* Category dot */}
              <span className="cat-dot" style={{
                background: CAT_COLOR[item.category] || 'var(--cat-news)',
                flexShrink: 0,
              }} />

              {/* Author */}
              <span className="aid-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {item.author}
              </span>

              {/* Headline */}
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {item.headline}
              </span>

              {/* Separator */}
              <span style={{ color: 'var(--border-strong)', margin: '0 4px', fontSize: 16 }}>·</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 1,
        background: 'linear-gradient(to left, var(--bg-deep), transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
