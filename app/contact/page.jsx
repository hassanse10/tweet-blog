export const metadata = {
  title: 'Contact — 1minAi',
  description: 'Get in touch with the 1minAi team.',
};

const CHANNELS = [
  {
    icon: '✉',
    label: 'General enquiries',
    value: 'hello@1minai.site',
    href: 'mailto:hello@1minai.site',
    desc: 'Questions, feedback, partnerships.',
  },
  {
    icon: '🛡',
    label: 'Privacy & data',
    value: 'privacy@1minai.site',
    href: 'mailto:privacy@1minai.site',
    desc: 'Data requests, GDPR, cookie questions.',
  },
  {
    icon: '⚠',
    label: 'Report an issue',
    value: 'report@1minai.site',
    href: 'mailto:report@1minai.site',
    desc: 'Factual errors, broken links, abuse.',
  },
];

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 56px 120px' }}>

      <p className="aid-kicker" style={{ marginBottom: 20 }}>Contact us</p>
      <h1 className="aid-display" style={{ fontSize: 52, margin: '0 0 20px', lineHeight: 1.02 }}>
        We'd love to<br /><span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>hear from you</span>.
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 56px' }}>
        Whether you've spotted a mistake, want to collaborate, or just have a question — reach out through any of the channels below. We typically respond within 1–2 business days.
      </p>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 56 }} />

      {/* Contact cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 64 }}>
        {CHANNELS.map(({ icon, label, value, href, desc }) => (
          <a key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: 24,
            padding: '24px 28px', borderRadius: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            transition: 'border-color 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: 28, flexShrink: 0, width: 48, textAlign: 'center' }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <p className="aid-kicker" style={{ margin: '0 0 4px', color: 'var(--text-muted)' }}>{label}</p>
              <p style={{ fontSize: 15, color: 'var(--accent-bright)', margin: '0 0 4px', fontWeight: 500 }}>{value}</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>{desc}</p>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>→</span>
          </a>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 48 }} />

      {/* Response time note */}
      <div style={{
        padding: '20px 24px', borderRadius: 10,
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <span style={{ color: 'var(--accent)', fontSize: 16, flexShrink: 0, marginTop: 2 }}>◐</span>
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 500 }}>Response time</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6 }}>
            We aim to reply to all messages within 1–2 business days. For urgent issues, please include "URGENT" in your subject line.
          </p>
        </div>
      </div>
    </div>
  );
}
