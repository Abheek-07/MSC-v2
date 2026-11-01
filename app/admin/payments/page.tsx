'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Download, RefreshCw, Search, XCircle } from 'lucide-react';

type PaymentRow = {
  order_id: string;
  payment_id: string;
  registration_id: string;
  event_id: string;
  event: string;
  attendee: string;
  email: string;
  amount_paise: number;
  currency: string;
  status: string;
  order_status: string;
  payment_status: string;
  created_at: string;
  paid_at: string;
  payment_record_id: string;
};

type DashboardData = {
  rows: PaymentRow[];
  events: Array<{ id: string; title: string }>;
  summary: {
    total_orders: number;
    captured_count: number;
    pending_count: number;
    failed_count: number;
    cancelled_count: number;
    captured_amount_paise: number;
    reconciliation_exceptions: number;
  };
};

const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
const date = (value: string) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function PaymentsAdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [eventId, setEventId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (eventId) params.set('event_id', eventId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [status, eventId, from, to, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/payments?${query}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load payments.');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const exportCsv = () => {
    window.location.href = `/api/admin/payments?format=csv${query ? `&${query}` : ''}`;
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(paymentId)}/receipt`);
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Receipt download failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MSC-Receipt-${paymentId.slice(0, 8)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Receipt download failed.');
    }
  };

  const cards = [
    { label: 'Collected', value: money(data?.summary.captured_amount_paise || 0), icon: CheckCircle2 },
    { label: 'Captured payments', value: data?.summary.captured_count || 0, icon: Activity },
    { label: 'Pending orders', value: data?.summary.pending_count || 0, icon: Clock3 },
    { label: 'Failed orders', value: data?.summary.failed_count || 0, icon: XCircle },
    { label: 'Cancelled orders', value: data?.summary.cancelled_count || 0, icon: XCircle },
    { label: 'Reconciliation exceptions', value: data?.summary.reconciliation_exceptions || 0, icon: AlertTriangle },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)' }}>Payment Reconciliation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>Review Razorpay orders against verified payment records. No refund actions are available.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void load()} disabled={loading} style={buttonStyle}><RefreshCw size={15} /> Refresh</button>
          <button onClick={exportCsv} style={primaryButton}><Download size={15} /> Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12 }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return <div key={card.label} style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 12 }}>
              {card.label}<Icon size={17} />
            </div>
            <div style={{ fontSize: 23, fontWeight: 700, marginTop: 12, color: 'var(--text-strong)' }}>{card.value}</div>
          </div>;
        })}
      </div>

      <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <label style={labelStyle}>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Attendee, email, payment ID..." style={inputStyle} /></label>
          <label style={labelStyle}>Event<select value={eventId} onChange={(e) => setEventId(e.target.value)} style={inputStyle}><option value="">All events</option>{data?.events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
          <label style={labelStyle}>Status<select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}><option value="all">All statuses</option><option value="captured">Captured</option><option value="created">Pending</option><option value="creating">Creating</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></label>
          <label style={labelStyle}>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} /></label>
        </div>
      </div>

      {error && <div role="alert" style={{ padding: 12, borderRadius: 8, background: 'var(--danger-bg)', color: 'var(--danger)' }}>{error}</div>}

      <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <strong style={{ color: 'var(--text-strong)' }}>Transactions</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{data?.rows.length || 0} records</span>
        </div>
        {loading ? <p style={{ padding: 24, color: 'var(--text-muted)' }}>Loading payment records...</p> : !data?.rows.length ? <p style={{ padding: 24, color: 'var(--text-muted)' }}>No payment records match these filters.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050, fontSize: 12 }}>
              <thead><tr style={{ background: 'var(--bg-soft)', textAlign: 'left' }}>{['Attendee / Event', 'Amount', 'Status', 'Razorpay Order ID', 'Payment ID', 'Date', 'Receipt'].map((heading) => <th key={heading} style={thStyle}>{heading}</th>)}</tr></thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={row.payment_id || row.order_id || row.registration_id || index} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={tdStyle}><strong style={{ color: 'var(--text-strong)' }}>{row.attendee}</strong><div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{row.event} · {row.email}</div></td>
                    <td style={tdStyle}><strong>{money(row.amount_paise)}</strong></td>
                    <td style={tdStyle}><span style={statusStyle(row.status)}>{row.status.replaceAll('_', ' ')}</span>{row.order_status === 'missing_order_record' && <div style={{ color: 'var(--danger)', marginTop: 5 }}>Order record missing</div>}</td>
                    <td style={tdStyle}>{row.order_id || '—'}</td>
                    <td style={tdStyle}>{row.payment_id || '—'}</td>
                    <td style={tdStyle}>{date(row.paid_at || row.created_at)}</td>
                    <td style={tdStyle}>{row.status === 'captured' && row.payment_record_id ? <button onClick={() => void downloadReceipt(row.payment_record_id)} style={buttonStyle}><Download size={14} /> PDF</button> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Amounts are read from stored payment records and payment orders. Captured status is based on server-verified records. This dashboard does not initiate refunds or change transaction status.</p>
    </div>
  );
}

const panelStyle: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 };
const buttonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--text-body)', cursor: 'pointer', fontSize: 12 };
const primaryButton: React.CSSProperties = { ...buttonStyle, background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-soft)', color: 'var(--text-strong)', fontSize: 12 };
const thStyle: React.CSSProperties = { padding: '12px 14px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '13px 14px', verticalAlign: 'top', color: 'var(--text-body)', maxWidth: 240, overflowWrap: 'anywhere' };
const statusStyle = (status: string): React.CSSProperties => ({ display: 'inline-block', padding: '4px 7px', borderRadius: 5, textTransform: 'capitalize', background: status === 'captured' ? 'var(--success-bg)' : status === 'failed' ? 'var(--danger-bg)' : 'var(--bg-soft)', color: status === 'captured' ? 'var(--success)' : status === 'failed' ? 'var(--danger)' : 'var(--text-muted)' });
