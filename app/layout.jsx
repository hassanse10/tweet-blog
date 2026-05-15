import { Suspense } from 'react';
import './globals.css';
import SearchBar from './components/SearchBar';
import NotificationBanner from './components/NotificationBanner';
import ReadingProgress from './components/ReadingProgress';

const BASE_URL = 'https://1minai.site';

export const metadata = {
  title: 'AI Digest',
  description: 'Breaking AI news from OpenAI, Anthropic, Google and more — summarized in minutes.',
  metadataBase: new URL(BASE_URL),
  verification: { google: 'WPXHcWraaMEOgVi-aMdMFDZ9i4gwVlptMva0yl1Wu00' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AI Digest',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
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
          <div style={{
            maxWidth: 1440, margin: '0 auto',
            padding: '0 56px', height: 64,
            display: 'flex', alignItems: 'center', gap: 32,
          }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                display: 'inline-flex', width: 28, height: 28, borderRadius: 6,
                background: 'var(--accent)', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 4px var(--accent-glow)',
              }}>
                <span className="aid-display" style={{ fontSize: 18, color: '#07090d', lineHeight: 1 }}>A</span>
              </span>
              <span className="aid-display" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
                AI Digest
              </span>
              <span className="aid-mono" style={{
                fontSize: 9, color: 'var(--text-tertiary)',
                border: '1px solid var(--border-strong)', borderRadius: 3, padding: '2px 5px', letterSpacing: '0.1em',
              }}>1MIN</span>
            </a>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 420 }}>
              <Suspense><SearchBar /></Suspense>
            </div>

            <div style={{ flex: 1 }} />

            {/* Subscribe button (triggers notification panel below) */}
            <a href="#notify" style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--accent)', color: '#fff',
              boxShadow: '0 0 0 0 var(--accent-glow)',
              transition: 'box-shadow 0.2s ease',
              flexShrink: 0,
            }}>
              Subscribe
            </a>
          </div>

          {/* Notification banner sits just below the nav bar */}
          <NotificationBanner />
        </header>

        <main style={{ maxWidth: 1440, margin: '0 auto' }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          maxWidth: 1440, margin: '80px auto 0',
          padding: '40px 56px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex', width: 22, height: 22, borderRadius: 5,
              background: 'var(--accent)', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="aid-display" style={{ fontSize: 14, color: '#07090d' }}>A</span>
            </span>
            <span className="aid-display" style={{ fontSize: 16, color: 'var(--text-secondary)' }}>AI Digest</span>
          </div>
          <p className="aid-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            AI news summarized in 1 minute · {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}
