'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');
  const [focused, setFocused] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    value.trim() ? params.set('q', value.trim()) : params.delete('q');
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }

  function handleClear() {
    setValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search articles…"
        style={{
          width: '100%',
          padding: '9px 36px 9px 14px',
          fontSize: 13,
          borderRadius: 8,
          border: '1px solid ' + (focused ? 'var(--border-strong)' : 'var(--border)'),
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
        }}
      />
      {value ? (
        <button type="button" onClick={handleClear} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, lineHeight: 1,
        }}>✕</button>
      ) : (
        <span className="aid-mono" style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none',
        }}>⌘K</span>
      )}
    </form>
  );
}
