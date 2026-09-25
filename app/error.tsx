'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log normalized error server-side / console
    console.error('[MSC ErrorBoundary caught]:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'var(--bg)'
    }}>
      <div style={{
        maxWidth: '540px',
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lift)',
        borderRadius: 'var(--radius-sm)',
        padding: '36px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <AlertCircle size={32} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '12px' }}>
          Something went wrong
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '28px' }}>
          An unexpected error occurred while processing this request. Our systems have logged this event for review.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            className="fluent-btn fluent-btn-primary"
            style={{ padding: '10px 20px' }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
          <Link
            href="/"
            className="fluent-btn fluent-btn-secondary"
            style={{ padding: '10px 20px' }}
          >
            <Home size={16} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
