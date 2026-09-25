import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { getAdminClient } from '@/lib/supabase/admin';

interface CheckinPageProps {
  params: Promise<{ hash: string }>;
}

export default async function DirectCheckinPage({ params }: CheckinPageProps) {
  const { hash } = await params;

  if (!hash) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '36px', textAlign: 'center', boxShadow: 'var(--shadow-rest)' }}>
          <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
            Invalid Token
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            No check-in identifier was provided.
          </p>
          <Link href="/admin" className="fluent-btn fluent-btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const supabase = getAdminClient();
  const { data: reg } = await supabase
    .from('registrations')
    .select('*, events(title, location)')
    .or(`hash_payload.eq.${hash},id.eq.${hash}`)
    .maybeSingle();

  if (!reg) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '36px', textAlign: 'center', boxShadow: 'var(--shadow-rest)' }}>
          <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
            Registration Record Not Found
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            The scanned token <code style={{ color: 'var(--danger)' }}>{hash}</code> could not be matched with any registration in the database.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/admin/scanner" className="fluent-btn fluent-btn-primary">
              Open QR Scanner
            </Link>
            <Link href="/admin" className="fluent-btn fluent-btn-secondary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Record check-in in database if not already checked in
  const wasAlreadyCheckedIn = Boolean(reg.checked_in);
  if (!wasAlreadyCheckedIn) {
    await supabase
      .from('registrations')
      .update({ checked_in: true, updated_at: new Date().toISOString() })
      .eq('id', reg.id);
  }

  const participantName =
    reg.form_data?.full_name || reg.form_data?.name || reg.lead_email.split('@')[0];
  const regNumber = reg.form_data?.registration_number || reg.form_data?.reg_num || 'N/A';
  const college = reg.form_data?.college || 'SRM University AP';
  const eventTitle = reg.events?.title || 'SYNORA';

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--surface)',
          border: wasAlreadyCheckedIn ? '2px solid var(--warning)' : '2px solid var(--success)',
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
            background: wasAlreadyCheckedIn ? 'var(--warning-bg)' : 'var(--success-bg)',
            color: wasAlreadyCheckedIn ? 'var(--warning)' : 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <span
          className={`fluent-badge ${wasAlreadyCheckedIn ? 'badge-warning' : 'badge-success'}`}
          style={{ marginBottom: '12px' }}
        >
          {wasAlreadyCheckedIn ? 'Already Checked In Earlier' : 'Check-in Verified & Granted'}
        </span>

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', margin: '8px 0' }}>
          {wasAlreadyCheckedIn ? 'Duplicate Scan' : 'Admission Approved'}
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '28px' }}>
          {eventTitle} &bull; Participant attendance ledger updated in real time.
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
          <div><strong>Participant:</strong> {participantName}</div>
          <div><strong>Registration No:</strong> {regNumber}</div>
          <div><strong>Email:</strong> {reg.lead_email}</div>
          <div><strong>Institution:</strong> {college}</div>
          <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link href="/admin" className="fluent-btn fluent-btn-secondary">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <Link href="/admin/scanner" className="fluent-btn fluent-btn-primary">
            Open Continuous Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
