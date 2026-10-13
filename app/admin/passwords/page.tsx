'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface ResetRequest {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function PasswordResetQueuePage() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/passwords');
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err: any) {
      console.error('Failed to fetch password requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingId(id);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request.`);

      setRequests(
        requests.map((r) =>
          r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        )
      );

      setMessage({
        type: 'success',
        text: `Request successfully ${action === 'approve' ? 'approved & password updated in database' : 'rejected'}.`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Error processing request: ${err.message}`,
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)' }}>
          Password Reset Approval Queue
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Review pending member credential resets. Passwords remain encrypted as AES-256-GCM ciphertext until approval.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px',
            background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Security notice */}
      <div
        style={{
          background: 'var(--bg-tinted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-body)',
        }}
      >
        <ShieldCheck size={20} color="var(--brand)" />
        <span>
          <strong>Cryptographic Safety Notice:</strong> Raw passwords are never displayed in the organizer UI. When approved,
          the server decrypts the ciphertext in memory using <code>DB_ENCRYPTION_KEY</code> and updates Supabase Auth directly.
        </span>
      </div>

      {/* Queue Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-rest)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', color: 'var(--text-strong)' }}>
              <th style={{ padding: '12px 16px' }}>Request ID</th>
              <th style={{ padding: '12px 16px' }}>Requester Email</th>
              <th style={{ padding: '12px 16px' }}>Ciphertext Protection</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Requested At</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading password reset queue...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No pending password reset requests. Queue is clean.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>{r.id}</td>
                <td style={{ padding: '14px 16px' }}>
                  <strong style={{ color: 'var(--text-strong)' }}>{r.email}</strong>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                    AES-256-GCM (iv:authTag:cipher)
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    className={`fluent-badge ${
                      r.status === 'approved'
                        ? 'badge-success'
                        : r.status === 'pending'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {r.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAction(r.id, 'approve')}
                        disabled={loadingId === r.id}
                        className="fluent-btn fluent-btn-primary"
                        style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--success)' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(r.id, 'reject')}
                        disabled={loadingId === r.id}
                        className="fluent-btn fluent-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger)' }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resolved</span>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
