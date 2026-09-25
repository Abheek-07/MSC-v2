'use client';

import React, { useEffect, useState } from 'react';

export default function RingLoader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if session has already skipped the loader
    if (typeof window !== 'undefined' && sessionStorage.getItem('msc_skip_loader')) {
      setLoading(false);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoading(false);
            sessionStorage.setItem('msc_skip_loader', 'true');
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  if (!loading) return null;

  const strokeDashoffset = 283 - (283 * Math.min(progress, 100)) / 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#05111c',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.4s ease',
      }}
    >
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          {/* Animated progress ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#0067b8"
            strokeWidth="4"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.08s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: 'var(--font-family)',
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          {Math.min(progress, 100)}%
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#58a6ff',
            fontWeight: 600,
          }}
        >
          Microsoft Student Community
        </span>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
          SRM University AP &bull; Chapter &apos;26
        </div>
      </div>
    </div>
  );
}
