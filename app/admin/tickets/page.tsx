'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { RefreshCw, Mail, RotateCw, Search, Ticket } from 'lucide-react';

type Member = { index: number; name: string; email: string; hash_payload: string; role: string };
type Registration = {
  id: string; event_id: string; event_title: string; event_date: string; event_location: string;
  lead_name: string; lead_email: string; hash_payload: string; team_name: string; members: Member[];
};

export default function TicketManagementPage() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tickets', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load tickets.');
      setRows(result.registrations || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load tickets.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (registrationId: string, memberIndex: number | null, action: 'resend' | 'regenerate') => {
    const key = `${registrationId}:${memberIndex ?? 'lead'}:${action}`;
    setBusy(key); setMessage('');
    try {
      const response = await fetch('/api/admin/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, member_index: memberIndex, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.token_updated && result.ticket_url) {
          setMessage(`New QR issued. Email delivery failed. Share this new link manually: ${result.ticket_url}`);
          await load();
          return;
        }
        throw new Error(result.error || 'Ticket action failed.');
      }
      setMessage(action === 'regenerate'
        ? `New QR issued and sent to ${result.email}. The previous QR is revoked.`
        : `Ticket resent to ${result.email}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ticket action failed.');
    } finally { setBusy(''); }
  };

  const normalized = search.trim().toLowerCase();
  const filtered = rows.filter((row) =>
    [row.lead_name, row.lead_email, row.event_title, row.team_name, ...row.members.flatMap((m) => [m.name, m.email])]
      .join(' ').toLowerCase().includes(normalized)
  );

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div><h1 style={{ color: 'var(--text-strong)', fontSize: 24, fontWeight: 700 }}>Ticket Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>Resend individual tickets or rotate QR tokens. Old tokens are revoked during regeneration.</p></div>
      <button onClick={() => void load()} style={buttonStyle}><RefreshCw size={15}/> Refresh</button>
    </div>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
      <Search size={16} color="var(--text-muted)"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search attendee, email, event or team..." style={{ flex: 1, border: 0, outline: 0, background: 'transparent', color: 'var(--text-strong)' }}/>
    </label>
    {message && <div role="status" style={{ padding: 12, borderRadius: 8, background: 'var(--bg-soft)', color: 'var(--text-body)', fontSize: 13 }}>{message}</div>}
    {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading tickets...</p> : filtered.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No confirmed tickets found.</p> : filtered.map((row) => <section key={row.id} style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <div><strong style={{ color: 'var(--text-strong)' }}>{row.event_title}</strong><div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{row.lead_name} · {row.lead_email}</div></div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.team_name || 'Individual registration'}</span>
      </div>
      {row.members.length === 0 && <Attendee name={row.lead_name} email={row.lead_email} role="Individual" onResend={() => void act(row.id, null, 'resend')} onRegenerate={() => void act(row.id, null, 'regenerate')} busy={busy} id={row.id} index={null}/>}
      {row.members.map((member) => <Attendee key={member.index} name={member.name} email={member.email} role={member.role} onResend={() => void act(row.id, member.index, 'resend')} onRegenerate={() => void act(row.id, member.index, 'regenerate')} busy={busy} id={row.id} index={member.index}/>)}
    </section>)}
  </div>;
}

function Attendee({ name, email, role, onResend, onRegenerate, busy, id, index }: {
  name: string; email: string; role: string; onResend: () => void; onRegenerate: () => void; busy: string; id: string; index: number | null;
}) {
  const resendKey = `${id}:${index ?? 'lead'}:resend`;
  const rotateKey = `${id}:${index ?? 'lead'}:regenerate`;
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12 }}>
    <div style={{ minWidth: 180 }}><div style={{ color: 'var(--text-strong)', fontSize: 13, fontWeight: 600 }}>{name}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{email || 'No member email recorded'} · {role}</div></div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onResend} disabled={!email || Boolean(busy)} style={buttonStyle}><Mail size={14}/> {busy === resendKey ? 'Sending…' : 'Resend'}</button>
      <button onClick={onRegenerate} disabled={!email || Boolean(busy)} style={buttonStyle}><RotateCw size={14}/> {busy === rotateKey ? 'Rotating…' : 'Regenerate QR'}</button>
    </div>
  </div>;
}
const cardStyle: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 };
const buttonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--text-body)', cursor: 'pointer', fontSize: 12 };
