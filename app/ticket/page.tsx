'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, ArrowRight, AlertCircle, Search, CheckCircle2 } from 'lucide-react';

interface ResolvedTicket {
  hash_payload: string;
  event_title: string;
  date_start: string;
  location: string;
  status: string;
  is_team_member?: boolean;
}

export default function TicketLookupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResolvedTicket[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResults(null);

    try {
      const res = await fetch('/api/ticket/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search for tickets.');
      }

      if (data.delivered) {
        setSuccessMsg(data.message || 'Pass details sent to your registered email address.');
      }
      setResults(data.tickets || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lookup failed. Please check the email or registration number entered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--text-body)',
            }}
          >
            <Ticket size={13} color="var(--brand)" />
            <span>MSC &bull; EVENT PASS LOOKUP &bull; SRM-AP</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            Find your event pass
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Enter your registered email address or university registration number below to retrieve your pass.
          </p>
        </div>

        {/* Search Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '28px',
            marginBottom: '28px',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                Registered email address or registration number
              </label>
              <input
                type="text"
                required
                placeholder="name@srmap.edu.in or AP21110010..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fluent-input"
                style={{ padding: '10px 12px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fluent-btn fluent-btn-primary"
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Search size={14} />
              <span>{loading ? 'Searching...' : 'Find my pass'}</span>
            </button>
          </form>

          {successMsg && (
            <div
              style={{
                marginTop: '18px',
                padding: '12px 14px',
                background: 'var(--success-bg, rgba(16, 124, 16, 0.1))',
                color: 'var(--success, #107c10)',
                border: '1px solid rgba(16, 124, 16, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                marginTop: '18px',
                padding: '12px 14px',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(197, 15, 31, 0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Results List */}
        {results !== null && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '14px' }}>
              Search results ({results.length})
            </h2>

            {results.length === 0 ? (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-strong)', fontWeight: 500 }}>
                  No confirmed tickets found for this query.
                </p>
                <p style={{ fontSize: '13px' }}>
                  Please ensure you entered the exact email or registration number used during sign-up.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((ticket, idx) => (
                  <div
                    key={idx}
                    className="fluent-card"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 4px 0' }}>
                          {ticket.event_title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="var(--brand)" />
                            {new Date(ticket.date_start).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="var(--brand)" />
                            {ticket.location}
                          </span>
                        </div>
                      </div>
                      <span
                        className="fluent-badge badge-success"
                        style={{ textTransform: 'capitalize', flexShrink: 0 }}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ticket.is_team_member ? 'Team Member Pass' : 'Individual Pass'}
                      </span>
                      <Link
                        href={`/ticket/${ticket.hash_payload}`}
                        className="fluent-btn fluent-btn-secondary"
                        style={{
                          fontSize: '12.5px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>View pass</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
