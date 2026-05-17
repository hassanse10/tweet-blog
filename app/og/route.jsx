import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'AI News in 1 Minute';
  const category = searchParams.get('category') || '';

  const CAT_COLORS = {
    Research: '#6366f1',
    Product:  '#10b981',
    Safety:   '#f59e0b',
    Business: '#3b82f6',
    News:     '#ec4899',
    Policy:   '#8b5cf6',
    AI:       '#14b8a6',
  };
  const accent = CAT_COLORS[category] || '#6366f1';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0f',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: accent,
          }} />
          {category && (
            <span style={{ fontSize: 18, color: accent, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              {category}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontSize: title.length > 80 ? 42 : 52,
          fontWeight: 700,
          color: '#f1f5f9',
          lineHeight: 1.15,
          maxWidth: 900,
        }}>
          {title}
        </div>

        {/* Brand footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
            1min<span style={{ color: accent }}>Ai</span>
          </span>
          <span style={{ fontSize: 16, color: '#64748b' }}>1minai.site</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
