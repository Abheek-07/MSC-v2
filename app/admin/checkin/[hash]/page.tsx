import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';

interface CheckinPageProps {
  params: Promise<{ hash: string }>;
}

export default async function DirectCheckinPage({ params }: CheckinPageProps) {
  const { hash } = await params;

  // UUID validation check
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hash);

  if (!isUUID) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '36px', textAlign: 'center', boxShadow: 'var(--shadow-rest)' }}>
          <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
            Invalid Check-in Token
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            The scanned QR code is not a valid UUID identifier.
          </p>
          <Link href="/admin" className="fluent-btn fluent-btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--surface)',
          border: '2px solid var(--success)',
          borderRadius: 'var(--radius-sm)',
          padding: '40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lift)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <span className="fluent-badge badge-success" style={{ marginBottom: '12px' }}>
          Check-in Verified &amp; Granted
        </span>

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', margin: '8px 0' }}>
          Admission Approved
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '28px' }}>
          Participant attendance recorded in the MSC registration ledger for Chapter &apos;26.
        </p>

        <div
          style={{
            background: 'var(--bg-soft)',
            padding: '20px',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'left',
            fontSize: '13px',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div><strong>Ticket Token:</strong> <span style={{ fontFamily: 'monospace' }}>{hash}</span></div>
          <div><strong>Institution:</strong> SRM University AP</div>
          <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link href="/admin" className="fluent-btn fluent-btn-secondary">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <Link href="/admin/events/e1000000-0000-0000-0000-000000000001/scanner" className="fluent-btn fluent-btn-primary">
            Open Continuous Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
