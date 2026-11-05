'use client';

import { useState } from 'react';

export default function WalletButtons({ token, enabled }: { token: string; enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!enabled || !token) return null;

  const addGoogleWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ticket/wallet/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.saveUrl !== 'string') {
        throw new Error(result.error || 'Google Wallet could not create this pass.');
      }
      window.location.assign(result.saveUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Wallet could not create this pass.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="Save ticket to mobile wallet" style={{
      display: 'flex', flexDirection: 'column', gap: '10px',
      padding: '16px', marginBottom: '16px', borderRadius: '10px',
      border: '1px solid var(--border)', background: 'var(--surface)',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-strong)' }}>
        Save your ticket to your phone
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" onClick={addGoogleWallet} disabled={loading}
          className="fluent-btn fluent-btn-primary" style={{ fontSize: '13px', padding: '9px 14px' }}>
          {loading ? 'Preparing Google Wallet…' : 'Add to Google Wallet'}
        </button>
        <a href={`/api/ticket/wallet/apple?token=${encodeURIComponent(token)}`}
          className="fluent-btn fluent-btn-secondary"
          style={{ fontSize: '13px', padding: '9px 14px', display: 'inline-flex', alignItems: 'center' }}>
          Add to Apple Wallet
        </a>
      </div>
      {error ? <p role="alert" style={{ color: 'var(--danger)', fontSize: '12px', margin: 0 }}>{error}</p> : null}
      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
        Wallet passes are generated only for confirmed tickets. Keep your QR code private.
      </p>
    </section>
  );
}
