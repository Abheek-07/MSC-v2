import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
        maxWidth: '520px',
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-rest)',
        borderRadius: 'var(--radius-sm)',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'var(--bg-soft)',
          color: 'var(--brand)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <FileQuestion size={32} />
        </div>

        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          404 Not Found
        </span>

        <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', margin: '8px 0 12px 0' }}>
          Page or Resource Missing
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '28px' }}>
          The requested page, event slug, or ticket could not be found. It may have been moved, concluded, or the URL contains a typo.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link
            href="/"
            className="fluent-btn fluent-btn-primary"
            style={{ padding: '10px 24px' }}
          >
            <ArrowLeft size={16} /> Return to Home
          </Link>
          <Link
            href="/events"
            className="fluent-btn fluent-btn-secondary"
            style={{ padding: '10px 20px' }}
          >
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
