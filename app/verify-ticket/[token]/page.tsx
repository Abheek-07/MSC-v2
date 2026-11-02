'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, LoaderCircle, ShieldAlert, AlertCircle, ArrowLeft, Search } from 'lucide-react';

type Verification = { valid: boolean; status: string; attendee?: string; event?: string; error?: string };

export default function VerifyTicketPage() {
  const params = useParams<{ token: string }>();
  const [result, setResult] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  useEffect(() => {
    if (!token) {
      setResult({ valid: false, status: 'invalid' });
      setLoading(false);
      return;
    }

    fetch(`/api/ticket/verify/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        setResult(data);
      })
      .catch(() => setResult({ valid: false, status: 'unavailable' }))
      .finally(() => setLoading(false));
  }, [token]);

  const valid = result?.valid === true;
  const isRevoked = result?.status === 'revoked';
  const isUnavailable = result?.status === 'unavailable';
  const isInvalid = !valid && !isRevoked && !isUnavailable;

  return (
    <main
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px 32px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        {/* Status Indicator Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            background: loading
              ? 'var(--bg-soft)'
              : valid
              ? 'var(--success-bg)'
              : isRevoked
              ? 'var(--warning-bg)'
              : 'var(--danger-bg)',
            color: loading
              ? 'var(--text-muted)'
              : valid
              ? 'var(--success)'
              : isRevoked
              ? 'var(--warning)'
              : 'var(--danger)',
          }}
        >
          {loading ? (
            <LoaderCircle size={28} className="animate-spin" />
          ) : valid ? (
            <CheckCircle2 size={28} />
          ) : isRevoked ? (
            <ShieldAlert size={28} />
          ) : isUnavailable ? (
            <AlertCircle size={28} />
          ) : (
            <XCircle size={28} />
          )}
        </div>

        <h1
          style={{
            color: 'var(--text-strong)',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            margin: '0 0 6px 0',
          }}
        >
          MSC Ticket Verification
        </h1>

        <p
          style={{
            color: loading
              ? 'var(--text-muted)'
              : valid
              ? 'var(--success)'
              : isRevoked
              ? 'var(--warning)'
              : 'var(--danger)',
            fontWeight: 600,
            margin: '0 0 16px 0',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {loading
            ? 'Checking ticket validity…'
            : isRevoked
            ? 'Ticket revoked'
            : valid
            ? 'Valid verified ticket'
            : isUnavailable
            ? 'Verification service unavailable'
            : 'Invalid ticket'}
        </p>

        {valid && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              color: 'var(--text-body)',
              fontSize: '13.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--text-strong)' }}>Attendee:</strong>{' '}
              {result?.attendee || 'Verified Participant'}
            </div>
            <div>
              <strong style={{ color: 'var(--text-strong)' }}>Event:</strong>{' '}
              {result?.event || 'MSC Community Event'}
            </div>
            {token && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                Token: {token.slice(0, 8)}...{token.slice(-4)}
              </div>
            )}
          </div>
        )}

        {isRevoked && (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              margin: '16px 0 0 0',
              lineHeight: 1.5,
            }}
          >
            This ticket has been revoked by an event administrator and can no longer be used for admission.
          </p>
        )}

        {isInvalid && !loading && (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              margin: '16px 0 0 0',
              lineHeight: 1.5,
            }}
          >
            Do not admit an attendee using this QR code. Ask them to present their latest ticket or search using their registered email.
          </p>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/ticket"
            className="fluent-btn fluent-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Search size={13} /> Find My Ticket
          </Link>
          <Link
            href="/"
            className="fluent-btn fluent-btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ArrowLeft size={13} /> Return to Home
          </Link>
        </div>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            marginTop: '24px',
            marginBottom: 0,
            letterSpacing: '0.02em',
          }}
        >
          Microsoft Student Community · SRM University-AP
        </p>
      </section>
    </main>
  );
}
