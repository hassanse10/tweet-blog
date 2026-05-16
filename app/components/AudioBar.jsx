'use client';

import { useState, useEffect, useRef } from 'react';

function getDuration(text) {
  const words = text.split(/\s+/).length;
  const secs = Math.round((words / 150) * 60);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioBar({ text }) {
  const [state, setState] = useState('idle'); // idle | playing | paused
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(false);
  const utterRef = useRef(null);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  function play() {
    if (!window.speechSynthesis) return;
    if (state === 'paused') {
      window.speechSynthesis.resume();
      setState('playing');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.onboundary = (e) => {
      if (e.name === 'word') setProgress((e.charIndex / text.length) * 100);
    };
    utter.onend = () => { setState('idle'); setProgress(0); };
    utter.onerror = () => setState('idle');
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setState('playing');
  }

  function pause() {
    window.speechSynthesis.pause();
    setState('paused');
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState('idle');
    setProgress(0);
  }

  if (!supported) return null;

  const isPlaying = state === 'playing';
  const isActive = state !== 'idle';
  const duration = getDuration(text);

  return (
    <div style={{
      margin: '24px 0 0',
      border: '1px solid var(--border)',
      borderRadius: 12,
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Progress track */}
      <div style={{ height: 2, background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--accent)',
          transition: 'width 0.5s linear',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px' }}>
        {/* Play / Pause */}
        <button
          onClick={isPlaying ? pause : play}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--accent)', border: 'none',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <rect x="5" y="4" width="4" height="16" rx="1"/>
              <rect x="15" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px' }}>
            {isPlaying ? 'Playing…' : state === 'paused' ? 'Paused' : 'Listen to the brief'}
          </p>
          <p className="aid-mono" style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
            {duration} · Web Speech
          </p>
        </div>

        {isActive && (
          <button onClick={stop} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '4px 6px',
          }}>✕</button>
        )}
      </div>
    </div>
  );
}
