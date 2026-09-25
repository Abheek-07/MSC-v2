'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: '60px 20px',
        backgroundColor: '#fffdfb',
        color: '#17253d',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          padding: '40px',
          border: '1px solid rgba(6,22,31,0.10)',
          borderRadius: '4px',
          background: '#ffffff',
          boxShadow: '0 6.4px 14.4px rgba(0,0,0,0.10)'
        }}>
          <h1 style={{ color: '#0067b8', fontSize: '24px', margin: '0 0 16px 0', fontWeight: 600 }}>
            Microsoft Student Community
          </h1>
          <h2 style={{ fontSize: '18px', color: '#17253d', margin: '0 0 12px 0' }}>
            System Encountered a Critical Error
          </h2>
          <p style={{ fontSize: '14px', color: '#616161', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            A fatal layout error occurred. Please refresh or retry loading the community application.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#0067b8',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
