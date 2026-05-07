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

export default function NotificationBanner() {
  // state: 'hidden' | 'collapsed' | 'expanded' | 'subscribed' | 'editing'
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
        const sources = stored ? JSON.parse(stored) : [];
        setSavedSources(sources);
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
    setSelected((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }

  async function enableNotifications() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const { publicKey } = await fetch('/api/vapid-key').then((r) => r.json());
    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), sources: selected }),
    });
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    setPushSub(sub);
    setSavedSources(selected);
    setState('subscribed');
  }

  async function savePreferences() {
    await fetch('/api/subscribe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: pushSub.toJSON(), sources: selected }),
    });
    localStorage.setItem(SOURCES_KEY, JSON.stringify(selected));
    setSavedSources(selected);
    setState('subscribed');
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
    setPushSub(null);
    setSavedSources([]);
    setState('collapsed');
  }

  if (state === 'hidden') return null;

  if (state === 'subscribed') {
    return (
      <div className="bg-indigo-950 border-b border-indigo-900 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-green-400">🔔 Subscribed:</span>
          {savedSources.map((s) => (
            <span key={s} className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full text-xs">
              {s}
            </span>
          ))}
        </div>
        <button
          onClick={() => { setSelected(savedSources); setState('editing'); }}
          className="text-indigo-400 text-xs underline shrink-0 ml-2"
        >
          Edit
        </button>
      </div>
    );
  }

  if (state === 'collapsed') {
    return (
      <div className="bg-indigo-900 border-b border-indigo-800 px-4 py-2 flex items-center justify-between">
        <span className="text-indigo-200 text-sm">🔔 Get notified when new AI articles drop</span>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <button
            onClick={() => setState('expanded')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Subscribe
          </button>
          <button onClick={dismiss} className="text-indigo-400 text-lg leading-none">✕</button>
        </div>
      </div>
    );
  }

  // state === 'expanded' | 'editing'
  return (
    <div className="bg-indigo-900 border-b border-indigo-800 px-4 py-3">
      <p className="text-indigo-200 text-sm mb-2">🔔 Pick the sources you want to follow:</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {SOURCES.map((source) => (
          <button
            key={source}
            onClick={() => toggleSource(source)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selected.includes(source)
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950 text-indigo-400 border border-indigo-700 hover:border-indigo-500'
            }`}
          >
            {selected.includes(source) ? '✓ ' : ''}{source}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={state === 'editing' ? savePreferences : enableNotifications}
          disabled={selected.length === 0}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm transition-colors"
        >
          {state === 'editing' ? 'Save Preferences' : 'Enable Notifications →'}
        </button>
        <button
          onClick={() => setState(state === 'editing' ? 'subscribed' : 'collapsed')}
          className="text-indigo-400 text-sm"
        >
          Cancel
        </button>
        {state === 'editing' && (
          <button onClick={unsubscribe} className="text-red-400 text-sm ml-auto">
            Unsubscribe
          </button>
        )}
      </div>
    </div>
  );
}
