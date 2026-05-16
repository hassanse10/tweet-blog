import { Suspense } from 'react';
import './globals.css';
import SearchBar from './components/SearchBar';
import NotificationBanner from './components/NotificationBanner';
import ReadingProgress from './components/ReadingProgress';
import NewsTicker from './components/NewsTicker';
import Logo from './components/Logo';
import { searchArticles } from '../lib/db';

const BASE_URL = 'https://1minai.site';

export const metadata = {
  title: '1minAi — AI News in 1 Minute',
  description: 'Breaking AI news from OpenAI, Anthropic, Google DeepMind and more — summarized in 1 minute.',
  metadataBase: new URL(BASE_URL),
  verification: { google: 'WPXHcWraaMEOgVi-aMdMFDZ9i4gwVlptMva0yl1Wu00' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '1minAi',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

const footerLinks = [
  { label: 'About',   href: '/about'   },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms'   },
];

export default function RootLayout({ children }) {
  const { articles: tickerArticles } = searchArticles({ limit: 20 });
  const tickerItems = tickerArticles.map((a) => ({
    slug:     a.slug,
    headline: (a.summary.split('\n').filter(Boolean)[0] || 'Untitled').slice(0, 80),
    category: a.category,
    author:   a.author,
  }));

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <ReadingProgress />

        {/* ── Navbar ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(10,14,20,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="nav-inner" style={{
            maxWidth: 1440, margin: '0 auto',
            padding: '0 56px', height: 64,
            display: 'flex', alignItems: 'center', gap: 32,
          }}>
            {/* Logo */}
            <a href="/" style={{ flexShrink: 0, textDecoration: 'none' }}>
              <Logo size={30} textSize={20} />
            </a>

            {/* Search */}
            <div className="nav-search" style={{ flex: 1, maxWidth: 420 }}>
              <Suspense><SearchBar /></Suspense>
            </div>

            <div style={{ flex: 1 }} />

            {/* Subscribe CTA */}
            <a href="#notify" style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--accent)', color: '#fff', flexShrink: 0,
              transition: 'opacity 0.2s',
            }}>
              Subscribe
            </a>
          </div>

          <NotificationBanner />
          <NewsTicker items={tickerItems} />
        </header>

        <main style={{ maxWidth: 1440, margin: '0 auto' }}>
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="page-pad" style={{
          maxWidth: 1440, margin: '80px auto 0',
          padding: '48px 56px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            {/* Brand */}
            <div>
              <Logo size={28} textSize={18} />
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '14px 0 0', maxWidth: 280, lineHeight: 1.6 }}>
                The fastest way to stay on top of AI. Every article summarized in under 1 minute.
              </p>
            </div>

            {/* Nav links */}
            <div className="footer-nav-cols" style={{ display: 'flex', gap: 48 }}>
              <div>
                <p className="aid-kicker" style={{ marginBottom: 16, color: 'var(--text-muted)' }}>Company</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {footerLinks.map(({ label, href }) => (
                    <a key={href} href={href} className="footer-link">
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="aid-kicker" style={{ marginBottom: 16, color: 'var(--text-muted)' }}>Topics</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Research', 'Product', 'Safety', 'Business'].map((cat) => (
                    <a key={cat} href={`/topic/${cat.toLowerCase()}`} className="footer-link">
                      {cat}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            marginTop: 48, paddingTop: 24,
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <p className="aid-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} 1minAi. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {footerLinks.map(({ label, href }) => (
                <a key={href} href={href} className="aid-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
