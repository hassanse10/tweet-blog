export default function Logo({ size = 32, showText = true, textSize = 20 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Logo mark */}
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#3B82F6"/>
        {/* Clock circle */}
        <circle cx="16" cy="16" r="9" stroke="#fff" strokeWidth="1.8" fill="none" opacity="0.9"/>
        {/* Clock hands — 1 minute mark */}
        <line x1="16" y1="16" x2="16" y2="9.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="16" x2="20" y2="16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        {/* Center dot */}
        <circle cx="16" cy="16" r="1.2" fill="#fff"/>
      </svg>

      {/* Wordmark */}
      {showText && (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
          <span className="aid-display" style={{
            fontSize: textSize,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            1min
          </span>
          <span className="aid-display" style={{
            fontSize: textSize,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontStyle: 'italic',
          }}>
            Ai
          </span>
        </span>
      )}
    </span>
  );
}
