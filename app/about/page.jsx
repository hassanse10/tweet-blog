import Logo from '../components/Logo';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';

export const metadata = {
  title: 'About — 1minAi',
  description: 'Learn about 1minAi — the fastest way to stay on top of AI news.',
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: 'About — 1minAi',
    description: 'Learn about 1minAi — the fastest way to stay on top of AI news.',
    url: `${BASE_URL}/about`,
    siteName: '1minAi',
    type: 'website',
    locale: 'en_US',
    images: [{ url: `${BASE_URL}/icon-192.png`, width: 192, height: 192, alt: '1minAi' }],
  },
  twitter: {
    card: 'summary',
    site: '@1minai',
    title: 'About — 1minAi',
    description: 'Learn about 1minAi — the fastest way to stay on top of AI news.',
  },
};

const TEAM = [
  { name: 'AI Research Team', role: 'Curation & Summarization', initial: 'R' },
  { name: 'Product Team',     role: 'Platform & Design',        initial: 'P' },
  { name: 'Engineering Team', role: 'Infrastructure & Automation', initial: 'E' },
];

const SOURCES = [
  { name: 'OpenAI',          mark: '◐', color: 'var(--text-secondary)' },
  { name: 'Anthropic',       mark: '✦', color: 'var(--cat-safety)'    },
  { name: 'Google DeepMind', mark: '◇', color: 'var(--cat-research)'  },
  { name: 'Hugging Face',    mark: '▲', color: 'var(--cat-product)'   },
  { name: 'Meta AI',         mark: '∞', color: 'var(--cat-business)'  },
  { name: 'Mistral',         mark: '◈', color: 'var(--cat-news)'      },
];

export default function AboutPage() {
  return (
    <div className="page-pad" style={{ maxWidth: 800, margin: '0 auto', padding: '72px 56px 120px' }}>

      {/* Header */}
      <p className="aid-kicker" style={{ marginBottom: 20 }}>About us</p>
      <h1 className="aid-display" style={{ fontSize: 56, margin: '0 0 24px', lineHeight: 1.02 }}>
        AI news in <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>1 minute</span>.
      </h1>
      <p style={{ fontSize: 20, lineHeight: 1.65, color: 'var(--text-secondary)', margin: '0 0 64px' }}>
        1minAi aggregates breaking AI news from the world's leading labs and research institutions, then distills each story into a crisp 60-second read — so you never fall behind, no matter how busy your day gets.
      </p>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 64 }} />

      {/* Mission */}
      <section style={{ marginBottom: 64 }}>
        <p className="aid-kicker" style={{ marginBottom: 16, color: 'var(--accent)' }}>Our mission</p>
        <h2 className="aid-display" style={{ fontSize: 32, margin: '0 0 20px' }}>
          Making AI accessible to everyone
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          The pace of AI development is breathtaking — and overwhelming. New models, papers, safety findings, and product releases land daily across dozens of sources. Most people don't have time to read everything.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0 }}>
          1minAi solves this. We automatically collect, process, and summarize the most important AI developments every day. Our summaries are concise, structured, and optimized to be read in under 60 seconds — giving you the full picture without the noise.
        </p>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: 64 }}>
        <p className="aid-kicker" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>How it works</p>
        <div className="article-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { step: '01', title: 'Collect', desc: 'We monitor official announcements, research papers, and posts from leading AI organizations in real time.' },
            { step: '02', title: 'Summarize', desc: 'Each article is processed by AI to extract the key findings, context, and implications — in plain language.' },
            { step: '03', title: 'Deliver', desc: 'Stories are published instantly on 1minAi and delivered as push notifications to subscribers.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{
              background: 'var(--bg-card)', borderRadius: 12,
              border: '1px solid var(--border)', padding: '24px',
            }}>
              <span className="aid-mono" style={{ fontSize: 11, color: 'var(--accent)', display: 'block', marginBottom: 12 }}>{step}</span>
              <h3 className="aid-display" style={{ fontSize: 22, margin: '0 0 10px' }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Policy */}
      <section style={{ marginBottom: 64 }}>
        <p className="aid-kicker" style={{ marginBottom: 16, color: 'var(--accent)' }}>Editorial policy</p>
        <h2 className="aid-display" style={{ fontSize: 32, margin: '0 0 20px' }}>
          How we ensure quality
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              title: 'AI-assisted, human-curated',
              body: 'Every article on 1minAi is produced with the assistance of large language models, but sourced exclusively from verified announcements, research papers, and official posts by leading AI organizations. We do not scrape generic web content.',
            },
            {
              title: 'Original source always linked',
              body: 'Each article prominently links back to its primary source — whether that\'s an official blog post, arXiv paper, or company announcement. We add context and analysis; we never replace the original.',
            },
            {
              title: 'Quality threshold for publication',
              body: 'Articles are only published when they meet a minimum content standard: a clear headline, categorization, supporting image, and structured body. Summaries that do not meet this bar are discarded before publication.',
            },
            {
              title: 'Corrections & contact',
              body: 'Found an error or outdated information? Use the contact page to report it. We review and correct factual errors promptly. Our goal is accuracy, not volume.',
            },
          ].map(({ title, body }) => (
            <div key={title} style={{
              padding: '20px 24px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>{title}</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 64 }} />

      {/* Sources */}
      <section style={{ marginBottom: 64 }}>
        <p className="aid-kicker" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Sources we cover</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {SOURCES.map(({ name, mark, color }) => (
            <div key={name} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 8,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
            }}>
              <span style={{ color, fontSize: 14 }}>{mark}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 48 }} />

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <a href="/" style={{
          padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500,
          background: 'var(--accent)', color: '#fff',
        }}>
          Read today's news →
        </a>
        <a href="/contact" style={{
          padding: '12px 24px', borderRadius: 8, fontSize: 14,
          border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
        }}>
          Get in touch
        </a>
      </div>
    </div>
  );
}
