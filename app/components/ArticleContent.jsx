'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ArticleImage from './ArticleImage';
import RatingButtons from './RatingButtons';
import AudioBar from './AudioBar';

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

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444">
            <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8z"/>
            <polygon fill="white" points="9.75,15.02 15.5,12 9.75,8.98"/>
          </svg>
          <span className="aid-kicker" style={{ color: 'var(--text-primary)' }}>Watch video</span>
        </div>
        {!playing ? (
          <div onClick={() => setPlaying(true)} style={{ position: 'relative', cursor: 'pointer', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
            <img src={thumb} alt="Video thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 4 }}><polygon points="5,3 19,12 5,21"/></svg>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '3px 8px' }}>
              <span className="aid-mono" style={{ fontSize: 10, color: '#fff' }}>Click to play</span>
            </div>
          </div>
        ) : (
          <div style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} title={headline}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        )}
      </div>
    );
  }

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
      <div style={{ padding: '20px 20px 22px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Watch explainers and coverage of this topic on YouTube.
        </p>
        <a href={`https://www.youtube.com/results?search_query=${searchQuery}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: '#ef4444', color: '#fff', textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          Search on YouTube
        </a>
      </div>
    </div>
  );
}

export default function ArticleContent({ article, related = [] }) {
  const lines      = article.summary.split('\n').filter(Boolean);
  const headline   = lines[0] || 'Untitled';
  const sections   = Array.isArray(article.sections) ? article.sections : [];
  const faqs       = Array.isArray(article.faqs)     ? article.faqs     : [];
  const paragraphs = sections.length ? [] : lines.slice(1).filter(Boolean);
  const mins       = readingTime(article.summary);
  const catColor   = CAT_COLOR[article.category] || 'var(--cat-news)';
  const showToc    = sections.length > 1 || faqs.length > 0;

  const articleText = sections.length > 0
    ? sections.map(s => `${s.heading}. ${s.body}`).join(' ')
    : paragraphs.join(' ');

  const sourceUrl = /^https?:\/\//.test(article.tweet_url) ? article.tweet_url : null;
  let sourceDomain = '';
  if (sourceUrl) { try { sourceDomain = new URL(sourceUrl).hostname.replace('www.', ''); } catch {} }

  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setBookmarked(saved.includes(article.slug));
  }, [article.slug]);

  function toggleBookmark() {
    const saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const next = saved.includes(article.slug)
      ? saved.filter(s => s !== article.slug)
      : [...saved, article.slug];
    localStorage.setItem('bookmarks', JSON.stringify(next));
    setBookmarked(next.includes(article.slug));
  }

  async function handleShare() {
    const url = `https://1minai.site/article/${article.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: headline, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article style={{ paddingBottom: 80 }}>

      {/* ── Hero image ── */}
      <div className="article-aspect" style={{ width: '100%', aspectRatio: '21/9', overflow: 'hidden' }}>
        <ArticleImage src={article.image_url} author={article.author} alt={headline}
          className="w-full h-full object-cover" />
      </div>

      {/* ── Headline block ── */}
      <div className="page-pad" style={{ padding: '48px 56px 0', maxWidth: 1100, margin: '0 auto' }}>

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
        <h1 className="aid-display article-h1" style={{
          fontSize: 52, lineHeight: 1.02, margin: '0 0 28px',
          color: 'var(--text-primary)', maxWidth: 900,
        }}>
          {headline}
        </h1>

        {/* Byline — avatar + author + date | reading time + share + bookmark */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          paddingBottom: 24, borderBottom: '1px solid var(--border)',
        }}>
          {/* Avatar + name + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-glow)', border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)' }}>
                {getInitials(article.author)}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1 }}>
                {article.author}
              </p>
              <p className="aid-meta" style={{ margin: 0 }}>{formatDate(article.created_at)}</p>
            </div>
          </div>

          {/* Actions: reading time + share + bookmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--accent-glow)', color: 'var(--accent-bright)',
              padding: '5px 12px', borderRadius: 999,
              fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
            }}>
              ◷ {mins} MIN
            </span>

            {/* Share */}
            <button onClick={handleShare} title={copied ? 'Copied!' : 'Share'} style={{
              width: 34, height: 34, borderRadius: 8,
              background: copied ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              border: '1px solid ' + (copied ? 'var(--accent)' : 'var(--border)'),
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: copied ? 'var(--accent-bright)' : 'var(--text-secondary)', transition: 'all 0.15s',
            }}>
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              )}
            </button>

            {/* Bookmark */}
            <button onClick={toggleBookmark} title={bookmarked ? 'Remove bookmark' : 'Bookmark'} style={{
              width: 34, height: 34, borderRadius: 8,
              background: bookmarked ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              border: '1px solid ' + (bookmarked ? 'var(--accent)' : 'var(--border)'),
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: bookmarked ? 'var(--accent-bright)' : 'var(--text-secondary)', transition: 'all 0.15s',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Audio bar */}
        {articleText && <AudioBar text={articleText} />}
      </div>

      {/* ── Body: sidebar TOC + prose ── */}
      <div className="page-pad article-body-grid" style={{
        padding: '56px 56px 0', maxWidth: 1100, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: showToc ? '200px 1fr' : '1fr',
        gap: showToc ? 72 : 0,
      }}>

        {/* Sidebar TOC */}
        {showToc && (
          <aside className="toc-sidebar" style={{ position: 'sticky', top: 88, alignSelf: 'start' }}>
            <p className="aid-kicker" style={{ marginBottom: 16 }}>In this brief</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sections.map((s, i) => (
                <li key={i} style={{ position: 'relative', paddingLeft: 14 }}>
                  {i === 0 && (
                    <span style={{ position: 'absolute', left: 0, top: 6, width: 5, height: 5, borderRadius: 999, background: 'var(--accent)' }} />
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
                  <a href={`#${article.id}-faq`} style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>FAQ</a>
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

          {/* Source link */}
          {sourceUrl && (
            <div style={{
              margin: '2em 0 0', padding: '14px 0',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: 'var(--accent)', fontSize: 14, flexShrink: 0 }}>↗</span>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                className="aid-meta" style={{ color: 'var(--text-secondary)' }}>
                Read the full article on{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{sourceDomain || 'source'}</strong>
              </a>
            </div>
          )}

          {/* Video section */}
          <VideoSection videoId={article.youtube_video_id} headline={headline} />

          {/* FAQ */}
          {faqs.length > 0 && (
            <div id={`${article.id}-faq`} style={{ marginTop: '2.5em', scrollMarginTop: 100 }}>
              <h2>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {faqs.map((f, i) => (
                  <details key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
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
        <div className="page-pad" style={{
          maxWidth: 1100, margin: '64px auto 0',
          padding: '0 56px',
          borderTop: '1px solid var(--border)', paddingTop: 48,
        }}>
          <p className="aid-kicker" style={{ marginBottom: 24 }}>Continue reading</p>
          <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {related.map((r) => {
              const rHeadline = r.summary.split('\n').find(Boolean) || 'Article';
              return (
                <Link key={r.id} href={`/article/${r.slug || r.id}`} style={{
                  display: 'block', padding: '18px 20px',
                  background: 'var(--bg-card)', borderRadius: 10,
                  border: '1px solid var(--border)', transition: 'border-color 0.2s',
                }}>
                  <span className="cat-dot" style={{ background: CAT_COLOR[r.category] || 'var(--cat-news)', display: 'block', marginBottom: 10 }} />
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
