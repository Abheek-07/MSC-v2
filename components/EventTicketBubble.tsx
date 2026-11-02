'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Ticket, Search, X, Calendar, MapPin, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';

interface ResolvedTicket {
  hash_payload: string;
  event_title: string;
  date_start: string;
  location: string;
  status: string;
  is_team_member?: boolean;
}

export default function EventTicketBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResolvedTicket[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on modal open & lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResults(null);

    try {
      const res = await fetch('/api/ticket/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search for tickets.');
      }

      setResults(data.tickets || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lookup failed. Please verify the email or registration number.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMsg(null);
  };

  return (
    <>
      {/* Floating Action Bubble */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Find your event ticket or pass"
        className="fluent-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 40,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '11px 18px',
          borderRadius: '9999px',
          backgroundColor: 'var(--brand)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 103, 184, 0.38), 0 2px 6px rgba(0, 0, 0, 0.16)',
          fontSize: '13.5px',
          fontWeight: 600,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Ticket size={16} />
        <span>Find My Pass</span>
      </button>

      {/* Slide-over / Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-lookup-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg, 8px)',
              boxShadow: 'var(--shadow-lift)',
              overflow: 'hidden',
              animation: 'slideUp 0.16s cubic-bezier(0.23, 1, 0.32, 1) forwards',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: 'var(--bg-soft)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    background: 'var(--brand-soft)',
                    border: '1px solid rgba(0, 103, 184, 0.2)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: 'var(--brand)',
                    marginBottom: '8px',
                  }}
                >
                  <Ticket size={12} />
                  <span>PASS LOOKUP &bull; SRM-AP</span>
                </div>
                <h2
                  id="ticket-lookup-dialog-title"
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-strong)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Find your event pass
                </h2>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-muted)',
                    margin: '4px 0 0 0',
                    lineHeight: 1.4,
                  }}
                >
                  Enter your registered email address or student registration number.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close pass lookup dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    htmlFor="pass-query-input"
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--text-strong)',
                    }}
                  >
                    Email address or registration number
                  </label>
                  <input
                    id="pass-query-input"
                    ref={inputRef}
                    type="text"
                    required
                    placeholder="name@srmap.edu.in or AP21110010..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="fluent-input"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13.5px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="fluent-btn fluent-btn-primary"
                    style={{
                      flex: 1,
                      padding: '9px 16px',
                      fontSize: '13.5px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Search size={14} />
                    <span>{loading ? 'Searching...' : 'Find passes'}</span>
                  </button>

                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setResults(null);
                        setErrorMsg(null);
                        inputRef.current?.focus();
                      }}
                      className="fluent-btn fluent-btn-secondary"
                      style={{
                        padding: '9px 14px',
                        fontSize: '13px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Error feedback */}
              {errorMsg && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 12px',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(197, 15, 31, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Search Results */}
              {results !== null && (
                <div style={{ marginTop: '20px' }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '10px',
                    }}
                  >
                    Found passes ({results.length})
                  </div>

                  {results.length === 0 ? (
                    <div
                      style={{
                        background: 'var(--bg-soft)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '24px 16px',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 4px 0' }}>
                        No confirmed passes found
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        Double-check that the email or registration number matches the one entered during registration.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {results.map((ticket, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: 'var(--text-strong)',
                                  margin: '0 0 4px 0',
                                  lineHeight: 1.3,
                                }}
                              >
                                {ticket.event_title}
                              </h4>
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  gap: '10px',
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={12} color="var(--brand)" />
                                  {new Date(ticket.date_start).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={12} color="var(--brand)" />
                                  {ticket.location}
                                </span>
                              </div>
                            </div>

                            <span
                              className="fluent-badge badge-success"
                              style={{ textTransform: 'capitalize', fontSize: '11px', flexShrink: 0 }}
                            >
                              {ticket.status}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--border)',
                            }}
                          >
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {ticket.is_team_member ? 'Team Member Pass' : 'Individual Pass'}
                            </span>
                            <Link
                              href={`/ticket/${ticket.hash_payload}`}
                              className="fluent-btn fluent-btn-secondary"
                              onClick={handleClose}
                              style={{
                                fontSize: '12px',
                                padding: '5px 10px',
                                borderRadius: 'var(--radius-sm)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none',
                              }}
                            >
                              <span>View pass</span>
                              <ArrowRight size={11} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
              }}
            >
              <Link
                href="/ticket"
                onClick={handleClose}
                style={{
                  color: 'var(--brand)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                <span>Full lookup page</span>
                <ExternalLink size={12} />
              </Link>

              <button
                type="button"
                onClick={handleClose}
                className="fluent-btn fluent-btn-secondary"
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
