export const metadata = {
  title: 'Terms of Service — 1minAi',
  description: 'Terms of Service for 1minAi.',
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

export default function TermsPage() {
  return (
    <div className="page-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '72px 56px 120px' }}>

      <p className="aid-kicker" style={{ marginBottom: 20 }}>Legal</p>
      <h1 className="aid-display" style={{ fontSize: 52, margin: '0 0 12px', lineHeight: 1.02 }}>Terms of Service</h1>
      <p className="aid-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 56 }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 56 }} />

      <P>Please read these Terms of Service ("Terms") carefully before using <strong style={{ color: 'var(--text-primary)' }}>1minai.site</strong> ("the Service") operated by 1minAi ("we", "us", "our"). By accessing or using the Service, you agree to be bound by these Terms.</P>

      <Section title="1. Acceptance of terms">
        <P>By accessing 1minAi, you confirm that you are at least 13 years of age and agree to these Terms and our <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>. If you do not agree, please do not use the Service.</P>
      </Section>

      <Section title="2. Description of service">
        <P>1minAi is a free news aggregation and summarization platform that collects publicly available AI-related announcements, research papers, and articles from third-party sources and presents AI-generated summaries for informational purposes.</P>
        <P>We do not claim ownership of the original articles. All original content belongs to the respective publishers and authors.</P>
      </Section>

      <Section title="3. Acceptable use">
        <P>You agree not to:</P>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          <Li>Scrape, crawl, or systematically extract data from the Service without prior written consent</Li>
          <Li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations</Li>
          <Li>Attempt to gain unauthorized access to any part of the Service or its underlying systems</Li>
          <Li>Interfere with or disrupt the integrity or performance of the Service</Li>
          <Li>Reproduce or redistribute article summaries for commercial purposes without permission</Li>
        </ul>
      </Section>

      <Section title="4. Intellectual property">
        <P>The 1minAi name, logo, design, and original content (including AI-generated summaries created by us) are the intellectual property of 1minAi. You may share individual article links but may not reproduce summaries in bulk or claim them as your own.</P>
        <P>Original article content belongs to the respective third-party publishers. We link to all source material and do not claim editorial ownership.</P>
      </Section>

      <Section title="5. Accuracy & disclaimer">
        <P>Article summaries are generated automatically using AI and may contain inaccuracies, omissions, or errors. The Service is provided for informational purposes only. 1minAi does not warrant the accuracy, completeness, or reliability of any summary.</P>
        <P><strong style={{ color: 'var(--text-primary)' }}>Do not rely on summaries as your sole source of information for decisions of consequence.</strong> Always consult the original source.</P>
      </Section>

      <Section title="6. Push notifications">
        <P>By enabling push notifications, you consent to receive browser push messages from 1minAi. You can unsubscribe at any time through the notification settings on the site or through your browser settings. We will not send spam or unrelated notifications.</P>
      </Section>

      <Section title="7. Limitation of liability">
        <P>To the fullest extent permitted by law, 1minAi shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to reliance on AI-generated summaries.</P>
      </Section>

      <Section title="8. Third-party links & content">
        <P>The Service links to third-party websites and may embed third-party media (e.g. YouTube). We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites.</P>
      </Section>

      <Section title="9. Modifications to the service">
        <P>We reserve the right to modify, suspend, or discontinue the Service at any time without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation.</P>
      </Section>

      <Section title="10. Changes to these terms">
        <P>We may update these Terms at any time. Changes will be indicated by the "Last updated" date at the top of this page. Continued use of the Service after changes constitutes your acceptance of the new Terms.</P>
      </Section>

      <Section title="11. Governing law">
        <P>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts.</P>
      </Section>

      <Section title="12. Contact">
        <P>For any questions about these Terms, please contact us at <a href="mailto:hello@1minai.site" style={{ color: 'var(--accent)' }}>hello@1minai.site</a>.</P>
      </Section>

      <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 40px' }} />

      <div style={{ display: 'flex', gap: 16 }}>
        <a href="/privacy" style={{ fontSize: 14, color: 'var(--accent)' }}>Privacy Policy →</a>
        <a href="/contact" style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Contact us</a>
      </div>
    </div>
  );
}
