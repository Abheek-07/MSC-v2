'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, LoaderCircle, ShieldAlert } from 'lucide-react';

type Verification = { valid: boolean; status: string; attendee?: string; event?: string };

export default function VerifyTicketPage() {
  const params = useParams<{ token: string }>();
  const [result, setResult] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = params.token;
    if (!token) return;
    fetch(`/api/ticket/verify/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        setResult(data);
      })
      .catch(() => setResult({ valid: false, status: 'unavailable' }))
      .finally(() => setLoading(false));
  }, [params.token]);

  const valid = result?.valid === true;
  return <main style={{ minHeight: '75vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
    <section style={{ width: '100%', maxWidth: 480, padding: 32, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', textAlign: 'center' }}>
      <div style={{ width: 58, height: 58, borderRadius: 30, display: 'grid', placeItems: 'center', margin: '0 auto 16px', background: loading ? 'var(--bg-soft)' : valid ? 'var(--success-bg)' : 'var(--danger-bg)', color: loading ? 'var(--text-muted)' : valid ? 'var(--success)' : 'var(--danger)' }}>
        {loading ? <LoaderCircle size={30}/> : valid ? <CheckCircle2 size={30}/> : <XCircle size={30}/>}
      </div>
      <h1 style={{ color: 'var(--text-strong)', fontSize: 22, fontWeight: 700 }}>MSC Ticket Verification</h1>
      <p style={{ color: valid ? 'var(--success)' : 'var(--danger)', fontWeight: 700, marginTop: 12, textTransform: 'uppercase' }}>
        {loading ? 'Checking ticket…' : result?.status === 'revoked' ? 'Ticket revoked' : valid ? 'Valid ticket' : result?.status === 'unavailable' ? 'Verification unavailable' : 'Invalid ticket'}
      </p>
      {valid && <div style={{ marginTop: 18, padding: 14, background: 'var(--bg-soft)', borderRadius: 8, textAlign: 'left', color: 'var(--text-body)', fontSize: 13 }}>
        <p><strong>Attendee:</strong> {result?.attendee}</p>
        <p style={{ marginTop: 8 }}><strong>Event:</strong> {result?.event}</p>
      </div>}
      {!valid && !loading && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Do not admit an attendee using this QR code. Ask them to present their latest ticket or contact the event administrator.</p>}
      <Link href="/" style={{ display: 'inline-block', marginTop: 22, color: 'var(--brand)', fontSize: 13 }}>Return to MSC</Link>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 24 }}>Microsoft Student Community · SRM University AP</p>
    </section>
  </main>;
}
