'use client';

import { useState } from 'react';
import Link from 'next/link';
import ArticleImage from './ArticleImage';
import RatingButtons from './RatingButtons';

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

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ── Video Section ── */
function VideoSection({ videoId, headline }) {
  const [playing, setPlaying] = useState(false);

  const sectionStyle = {
    margin: '2.5em 0',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
  };

  const headerStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  };

  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          {/* YouTube icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444">
            <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8z"/>
            <polygon fill="white" points="9.75,15.02 15.5,12 9.75,8.98"/>
          </svg>
          <span className="aid-kicker" style={{ color: 'var(--text-primary)' }}>Watch video</span>
        </div>

        {!playing ? (
          <div
            onClick={() => setPlaying(true)}
            style={{
              position: 'relative', cursor: 'pointer',
              aspectRatio: '16/9', overflow: 'hidden', background: '#000',
            }}
          >
            <img
              src={thumb}
              alt="Video thumbnail"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
            />
            {/* Play button */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: 'transform 0.2s, background 0.2s',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 4 }}>
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(0,0,0,0.7)', borderRadius: 4,
              padding: '3px 8px',
            }}>
              <span className="aid-mono" style={{ fontSize: 10, color: '#fff' }}>Click to play</span>
            </div>
          </div>
        ) : (
          <div style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={headline}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    );
  }

  // No video ID — show YouTube search fallback
  const searchQuery = encodeURIComponent(`${headline} AI`);
  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-tertiary)">
          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8z"/>
          <polygon fill="var(--bg-card)" points="9.75,15.02 15.5,12 9.75,8.98"/>
        </svg>
        <span className="aid-kicker" style={{ color: 'var(--text-secondary)' }}>Related video</span>
      </div>
      <div style={{ padding: '20px 20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Watch explainers and coverage of this topic on YouTube.
          </p>
          <a
            href={`https://www.youtube.com/results?search_query=${searchQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: '#ef4444', color: '#fff', textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Search on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ArticleContent({ article, related = [] }) {
  const lines    = article.summary.split('\n').filter(Boolean);
  const headline = lines[0] || 'Untitled';
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const faqs     = Array.isArray(article.faqs)     ? article.faqs     : [];
  const paragraphs = sections.length ? [] : lines.slice(1).filter(Boolean);
  const mins     = readingTime(article.summary);
  const catColor = CAT_COLOR[article.category] || 'var(--cat-news)';
  const showToc  = sections.length > 1 || faqs.length > 0;

  return (
    <article style={{ paddingBottom: 120 }}>

      {/* ── Hero image (always shown — ArticleImage handles gradient fallback) ── */}
      <div style={{ width: '100%', aspectRatio: '21/9', overflow: 'hidden' }}>
        <ArticleImage src={article.image_url} author={article.author} alt={headline}
          className="w-full h-full object-cover" />
      </div>

      {/* ── Headline block ── */}
      <div style={{ padding: '48px 56px 0', maxWidth: 1100, margin: '0 auto' }}>
        {/* Kicker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span className="cat-dot" style={{ background: catColor }} />
          <Link href={`/topic/${encodeURIComponent((article.category || 'news').toLowerCase())}`}
            className="aid-kicker" style={{ color: catColor }}>
            {article.category || 'News'}
          </Link>
          <span className="aid-kicker" style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="aid-kicker">{article.author}</span>
        </div>

        {/* Title */}
        <h1 className="aid-display" style={{
          fontSize: 52, lineHeight: 1.02, margin: '0 0 28px',
          color: 'var(--text-primary)', maxWidth: 900,
        }}>
          {headline}
        </h1>

        {/* Byline */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          paddingBottom: 28, borderBottom: '1px solid var(--border)',
        }}>
          <span className="aid-meta">{article.author}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="aid-meta">{formatDate(article.created_at)}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="aid-meta" style={{
            background: 'var(--accent-glow)', color: 'var(--accent-bright)',
            padding: '3px 10px', borderRadius: 999,
          }}>
            {mins} min read
          </span>
          {/^https?:\/\//.test(article.tweet_url) && (
            <>
              <div style={{ flex: 1 }} />
              <a href={article.tweet_url} target="_blank" rel="noopener noreferrer"
                className="aid-meta" style={{ color: 'var(--accent)', textDecoration: 'underline', textDecorationColor: 'var(--accent-glow)' }}>
                Read original →
              </a>
            </>
          )}
        </div>
      </div>

      {/* ── Body: sidebar TOC + prose ── */}
      <div style={{
        padding: '56px 56px 0', maxWidth: 1100, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: showToc ? '200px 1fr' : '1fr',
        gap: showToc ? 72 : 0,
      }}>

        {/* Sidebar TOC */}
        {showToc && (
          <aside style={{ position: 'sticky', top: 88, alignSelf: 'start' }}>
            <p className="aid-kicker" style={{ marginBottom: 16 }}>In this brief</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sections.map((s, i) => (
                <li key={i} style={{ position: 'relative', paddingLeft: 14 }}>
                  {i === 0 && (
                    <span style={{
                      position: 'absolute', left: 0, top: 6,
                      width: 5, height: 5, borderRadius: 999,
                      background: 'var(--accent)',
                    }} />
                  )}
                  <a href={`#section-${article.id}-${toSlug(s.heading)}`} style={{
                    fontSize: 13, lineHeight: 1.4,
                    color: i === 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    transition: 'color 0.15s',
                  }}>
                    {s.heading}
                  </a>
                </li>
              ))}
              {faqs.length > 0 && (
                <li style={{ paddingLeft: 14 }}>
                  <a href={`#${article.id}-faq`} style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    FAQ
                  </a>
                </li>
              )}
            </ul>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <RatingButtons articleId={article.id} initialRating={article.rating} />
            </div>
          </aside>
        )}

        {/* Prose body */}
        <div className="aid-prose" style={{ maxWidth: 680 }}>
          {sections.length > 0 ? (
            sections.map((s, i) => (
              <section key={i} id={`section-${article.id}-${toSlug(s.heading)}`} style={{ marginBottom: '2.5em', scrollMarginTop: 100 }}>
                <h2>{s.heading}</h2>
                <p>{s.body}</p>
              </section>
            ))
          ) : (
            paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'lede' : ''}>{p}</p>
            ))
          )}

          {/* Video section — always shown, falls back to YouTube search */}
          <VideoSection videoId={article.youtube_video_id} headline={headline} />

          {/* FAQ */}
          {faqs.length > 0 && (
            <div id={`${article.id}-faq`} style={{ marginTop: '2.5em', scrollMarginTop: 100 }}>
              <h2>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {faqs.map((f, i) => (
                  <details key={i} style={{
                    border: '1px solid var(--border)', borderRadius: 8,
                    overflow: 'hidden',
                  }}>
                    <summary style={{
                      padding: '14px 18px', cursor: 'pointer', fontSize: 15,
                      fontWeight: 500, color: 'var(--text-primary)', listStyle: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      {f.question}
                      <span style={{ color: 'var(--text-tertiary)', marginLeft: 12, flexShrink: 0 }}>▾</span>
                    </summary>
                    <p style={{ padding: '0 18px 16px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                      {f.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Rating (when no TOC sidebar) */}
          {!showToc && (
            <div style={{ marginTop: '2em', paddingTop: '2em', borderTop: '1px solid var(--border)' }}>
              <RatingButtons articleId={article.id} initialRating={article.rating} />
            </div>
          )}
        </div>
      </div>

      {/* ── Related articles ── */}
      {related.length > 0 && (
        <div style={{
          maxWidth: 1100, margin: '64px auto 0',
          padding: '0 56px',
          borderTop: '1px solid var(--border)', paddingTop: 48,
        }}>
          <p className="aid-kicker" style={{ marginBottom: 24 }}>Continue reading</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {related.map((r) => {
              const rHeadline = r.summary.split('\n').find(Boolean) || 'Article';
              return (
                <Link key={r.id} href={`/article/${r.slug || r.id}`} style={{
                  display: 'block', padding: '18px 20px',
                  background: 'var(--bg-card)', borderRadius: 10,
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.2s',
                }}>
                  <span className="cat-dot" style={{
                    background: CAT_COLOR[r.category] || 'var(--cat-news)',
                    display: 'block', marginBottom: 10,
                  }} />
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, margin: '0 0 8px' }}>
                    {rHeadline}
                  </p>
                  <p className="aid-meta">{r.author} · {formatDate(r.created_at)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
