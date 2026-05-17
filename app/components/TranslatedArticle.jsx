'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const LANG_FLAGS = { es: '🇪🇸', fr: '🇫🇷' };

export default function TranslatedArticle({ article, lang, langLabel, cachedTranslation }) {
  const [summary, setSummary] = useState(cachedTranslation);
  const [loading, setLoading] = useState(!cachedTranslation);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedTranslation) return;
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: article.slug, lang }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSummary(data.summary);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [article.slug, lang, cachedTranslation]);

  const lines = (summary || article.summary).split('\n').filter(Boolean);
  const headline = lines[0] || 'AI Update';
  const body = lines.slice(1);

  return (
    <div className="page-pad" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 56px 80px' }}>

      {/* Lang badge + switch to English */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </Link>
        <span style={{ color: 'var(--border)', fontSize: 13 }}>|</span>
        <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {LANG_FLAGS[lang]} {langLabel}
        </span>
        <Link href={`/article/${article.slug}`} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Read in English →
        </Link>
      </div>

      {/* Image */}
      {article.image_url && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 28, aspectRatio: '16/9' }}>
          <img src={article.image_url} alt={headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Category + author */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, fontSize: 12 }} className="aid-kicker">
        {article.category && <span style={{ color: 'var(--accent)' }}>{article.category}</span>}
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span>{article.author}</span>
      </div>

      {/* Headline */}
      <h1 className="aid-display" style={{ fontSize: 36, lineHeight: 1.15, margin: '0 0 24px' }}>
        {headline}
      </h1>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Translating to {langLabel}…
        </div>
      ) : error ? (
        <div style={{ padding: '20px', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 14 }}>
          Translation unavailable. <Link href={`/article/${article.slug}`} style={{ color: 'var(--accent)' }}>Read in English →</Link>
        </div>
      ) : (
        <div style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          {body.map((para, i) => <p key={i} style={{ margin: '0 0 18px' }}>{para}</p>)}
        </div>
      )}

      {/* Footer link */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <Link href={`/article/${article.slug}`} style={{ fontSize: 13, color: 'var(--accent)' }}>
          Read original in English →
        </Link>
      </div>
    </div>
  );
}
