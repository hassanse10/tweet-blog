'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  { label: 'Research', color: 'var(--cat-research)' },
  { label: 'Product',  color: 'var(--cat-product)'  },
  { label: 'Safety',   color: 'var(--cat-safety)'   },
  { label: 'Business', color: 'var(--cat-business)' },
  { label: 'News',     color: 'var(--cat-news)'     },
];

export default function FilterBar({ sources }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSource   = searchParams.get('source')   || '';
  const activeCategory = searchParams.get('category') || '';

  function setParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }

  const pillBase = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '7px 14px', borderRadius: 999, fontSize: 13,
    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    transition: 'all 0.15s ease', whiteSpace: 'nowrap',
  };

  const activePill = { ...pillBase, background: 'var(--text-primary)', color: 'var(--bg-base)', fontWeight: 500 };
  const inactivePill = { ...pillBase, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontWeight: 400 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button style={!activeCategory ? activePill : inactivePill}
          onClick={() => setParam('category', '')}>
          All
        </button>
        {CATEGORIES.map(({ label, color }) => (
          <button key={label}
            style={activeCategory === label ? activePill : inactivePill}
            onClick={() => setParam('category', activeCategory === label ? '' : label)}>
            <span className="cat-dot" style={{ background: color, width: 5, height: 5 }} />
            {label}
          </button>
        ))}
      </div>

      {/* Source pills */}
      {sources.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span className="aid-kicker" style={{ marginRight: 4 }}>Source</span>
          <button style={!activeSource ? activePill : inactivePill}
            onClick={() => setParam('source', '')}>
            All
          </button>
          {sources.map((s) => (
            <button key={s}
              style={activeSource === s ? activePill : inactivePill}
              onClick={() => setParam('source', activeSource === s ? '' : s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
