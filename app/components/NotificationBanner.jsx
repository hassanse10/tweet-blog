'use client';

import { useState, useEffect } from 'react';

const SOURCES = ['OpenAI', 'Anthropic', 'Google AI', 'DeepMind', 'Meta AI', 'HuggingFace'];
const DISMISS_KEY = 'notif_dismissed';
const SOURCES_KEY = 'notif_sources';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const bannerBase = {
  borderTop: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  padding: '12px 56px',
  display: 'flex', alignItems: 'center',
  fontSize: 13,
};

export default function NotificationBanner() {
  const [state, setState] = useState('hidden');
  const [selected, setSelected] = useState(['OpenAI', 'Anthropic']);
  const [savedSources, setSavedSources] = useState([]);
  const [swReg, setSwReg] = useState(null);
  const [pushSub, setPushSub] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    (async () => {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setSwReg(reg);
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setPushSub(existing);
        const stored = localStorage.getItem(SOURCES_KEY);
        setSavedSources(stored ? JSON.parse(stored) : []);
        setState('subscribed');
      } else if (!localStorage.getItem(DISMISS_KEY)) {
        setState('collapsed');
      }
    })();
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setState('hidden');
  }

  function toggleSource(source) {
    setSelected((prev) => prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]);
  }

  async function enableNotifications() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const { publicKey } = await fetch('/api/vapid-key').then((r) => r.json());
    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), sources: selected }),
    });
    if (!res.ok) { await sub.unsubscribe(); return; }
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    setPushSub(sub); setSavedSources(selected); setState('subscribed');
  }

  async function savePreferences() {
    await fetch('/api/subscribe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: pushSub.toJSON(), sources: selected }),
    });
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    setSavedSources(selected); setState('subscribed');
  }

  async function unsubscribe() {
    await pushSub.unsubscribe();
    await fetch('/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: pushSub.endpoint }),
    });
    localStorage.removeItem(SOURCES_KEY);
    localStorage.removeItem(DISMISS_KEY);
    setPushSub(null); setSavedSources([]); setState('collapsed');
  }

  if (state === 'hidden') return null;

  if (state === 'subscribed') {
    return (
      <div id="notify" style={bannerBase}>
        <span style={{ color: 'var(--cat-product)', marginRight: 10 }}>●</span>
        <span className="aid-kicker" style={{ color: 'var(--text-secondary)', marginRight: 12 }}>Subscribed</span>
        {savedSources.map((s) => (
          <span key={s} style={{
            marginRight: 6, padding: '2px 8px', borderRadius: 4,
            background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}>{s}</span>
        ))}
        <button onClick={() => { setSelected(savedSources.length > 0 ? savedSources : ['OpenAI', 'Anthropic']); setState('editing'); }}
          style={{ marginLeft: 12, color: 'var(--accent)', fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
          Edit
        </button>
      </div>
    );
  }

  if (state === 'collapsed') {
    return (
      <div id="notify" style={bannerBase}>
        <span style={{ color: 'var(--accent-bright)', marginRight: 10, fontSize: 12 }}>◐</span>
        <span style={{ color: 'var(--text-secondary)', flex: 1, fontSize: 13 }}>
          Get notified when new AI articles drop
        </span>
        <button onClick={() => setState('expanded')} style={{
          marginRight: 12, padding: '6px 14px', borderRadius: 6,
          background: 'var(--accent)', color: '#fff', fontSize: 12,
          cursor: 'pointer', border: 'none', fontWeight: 500, fontFamily: 'inherit',
        }}>
          Enable
        </button>
        <button onClick={dismiss} style={{
          color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer',
          background: 'none', border: 'none', lineHeight: 1,
        }}>✕</button>
      </div>
    );
  }

  // expanded / editing
  return (
    <div id="notify" style={{ ...bannerBase, flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
      <p className="aid-kicker" style={{ color: 'var(--text-secondary)', margin: 0 }}>
        Pick the sources you want to follow:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SOURCES.map((source) => (
          <button key={source} onClick={() => toggleSource(source)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
            background: selected.includes(source) ? 'var(--accent)' : 'var(--bg-elevated)',
            color: selected.includes(source) ? '#fff' : 'var(--text-tertiary)',
            border: '1px solid ' + (selected.includes(source) ? 'var(--accent)' : 'var(--border-strong)'),
          }}>
            {selected.includes(source) ? '✓ ' : ''}{source}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={state === 'editing' ? savePreferences : enableNotifications}
          disabled={selected.length === 0}
          style={{
            padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            border: 'none', fontFamily: 'inherit',
            opacity: selected.length === 0 ? 0.4 : 1,
          }}>
          {state === 'editing' ? 'Save Preferences' : 'Enable Notifications →'}
        </button>
        <button onClick={() => setState(state === 'editing' ? 'subscribed' : 'collapsed')}
          style={{ color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
          Cancel
        </button>
        {state === 'editing' && (
          <button onClick={unsubscribe}
            style={{ color: 'var(--cat-business)', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', marginLeft: 'auto' }}>
            Unsubscribe
          </button>
        )}
      </div>
    </div>
  );
}
