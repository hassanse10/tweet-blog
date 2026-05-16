export const metadata = {
  title: 'Privacy Policy — 1minAi',
  description: 'Privacy Policy for 1minAi.',
};

const LAST_UPDATED = 'May 16, 2026';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 className="aid-display" style={{ fontSize: 26, margin: '0 0 16px', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }) {
  return (
    <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
      {children}
    </p>
  );
}

function Li({ children }) {
  return (
    <li style={{
      fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)',
      paddingLeft: 20, position: 'relative', marginBottom: 8,
    }}>
      <span style={{ position: 'absolute', left: 0, top: 10, width: 8, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
      {children}
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 56px 120px' }}>

      <p className="aid-kicker" style={{ marginBottom: 20 }}>Legal</p>
      <h1 className="aid-display" style={{ fontSize: 52, margin: '0 0 12px', lineHeight: 1.02 }}>Privacy Policy</h1>
      <p className="aid-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 56 }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 56 }} />

      <Section title="1. Who we are">
        <P>1minAi ("we", "our", or "us") operates the website <strong style={{ color: 'var(--text-primary)' }}>1minai.site</strong> — an AI news aggregation and summarization service. This Privacy Policy explains how we collect, use, and protect your personal data.</P>
        <P>For any privacy-related questions, contact us at <a href="mailto:privacy@1minai.site" style={{ color: 'var(--accent)' }}>privacy@1minai.site</a>.</P>
      </Section>

      <Section title="2. Data we collect">
        <P>We collect minimal data to operate the service:</P>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          <Li><strong style={{ color: 'var(--text-primary)' }}>Push notification subscription</strong> — if you subscribe to notifications, we store your browser's push endpoint and your chosen source preferences. No email or personal identity is required.</Li>
          <Li><strong style={{ color: 'var(--text-primary)' }}>Usage analytics</strong> — we may collect anonymized, aggregated data (page views, article clicks) to improve the service. No personally identifiable information is stored.</Li>
          <Li><strong style={{ color: 'var(--text-primary)' }}>Server logs</strong> — standard web server logs (IP addresses, user agents) are retained for up to 30 days for security purposes.</Li>
        </ul>
      </Section>

      <Section title="3. Cookies & local storage">
        <P>We use browser <strong style={{ color: 'var(--text-primary)' }}>localStorage</strong> to remember your notification preferences (dismissed or active). No third-party tracking cookies are set. We do not use advertising networks or cross-site trackers.</P>
      </Section>

      <Section title="4. How we use your data">
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          <Li>Delivering push notifications for the AI sources you selected</Li>
          <Li>Improving the quality and relevance of article summaries</Li>
          <Li>Monitoring service health and preventing abuse</Li>
        </ul>
        <P>We do not sell, rent, or share your personal data with third parties for marketing purposes.</P>
      </Section>

      <Section title="5. Data retention">
        <P>Push notification subscriptions are retained until you unsubscribe (via the settings on our site) or until the browser endpoint expires. You can delete your subscription at any time — no account required.</P>
      </Section>

      <Section title="6. Your rights">
        <P>Depending on your jurisdiction, you may have the right to:</P>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          <Li>Access the personal data we hold about you</Li>
          <Li>Request deletion of your data</Li>
          <Li>Withdraw consent for push notifications at any time</Li>
          <Li>Lodge a complaint with your local data protection authority</Li>
        </ul>
        <P>To exercise any of these rights, email <a href="mailto:privacy@1minai.site" style={{ color: 'var(--accent)' }}>privacy@1minai.site</a>.</P>
      </Section>

      <Section title="7. Third-party services">
        <P>We embed YouTube videos (when available) using YouTube's standard embed. YouTube may set its own cookies when you interact with embedded videos. Please refer to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Google's Privacy Policy</a> for details.</P>
      </Section>

      <Section title="8. Changes to this policy">
        <P>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date above. Continued use of the service after changes constitutes acceptance of the revised policy.</P>
      </Section>

      <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 40px' }} />

      <div style={{ display: 'flex', gap: 16 }}>
        <a href="/terms" style={{ fontSize: 14, color: 'var(--accent)' }}>Terms of Service →</a>
        <a href="/contact" style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Contact us</a>
      </div>
    </div>
  );
}
