'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Ticket, Calendar, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
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

      setResults(data.tickets || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lookup failed. Please check the email or registration number entered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Ticket size={28} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
            Find Your Digital Ticket
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Lost your pass link? Enter your registered email address or college registration number below. We match individual attendees, team leaders, and named teammates.
          </p>
        </div>

        {/* Search Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '32px',
            marginBottom: '32px',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                Registered Email Address or College Registration Number
              </label>
              <input
                type="text"
                required
                placeholder="name@srmap.edu.in or AP26110010..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fluent-input"
                style={{ padding: '12px', fontSize: '15px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fluent-btn fluent-btn-primary"
              style={{ padding: '12px', fontSize: '15px' }}
            >
              {loading ? 'Searching Ledger...' : 'Find My Admission Passes'}
            </button>
          </form>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {/* Search Results */}
        {results !== null && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '16px' }}>
              Found Passes ({results.length})
            </h3>

            {results.length === 0 ? (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                No active confirmed tickets found matching <strong>{email}</strong>. Check for typos or register for an upcoming event.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {results.map((t) => (
                  <div
                    key={t.hash_payload}
                    className="fluent-card"
                    style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}
                  >
                    <div>
                      <span className="fluent-badge badge-success" style={{ marginBottom: '8px' }}>
                        {t.status.toUpperCase()}
                      </span>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0' }}>
                        {t.event_title}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span>{new Date(t.date_start).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <span>{t.location}</span>
                      </div>
                    </div>

                    <Link
                      href={`/ticket/${t.hash_payload}`}
                      className="fluent-btn fluent-btn-primary"
                      style={{ padding: '8px 18px', fontSize: '13px' }}
                    >
                      Open Digital Ticket &rarr;
                    </Link>
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
