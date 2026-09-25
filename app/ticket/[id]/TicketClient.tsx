'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import {
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Download,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Users,
} from 'lucide-react';

interface TicketData {
  hash_payload: string;
  event_id: string;
  event_title: string;
  event_date: string;
  event_location: string;
  lead_name: string;
  lead_email: string;
  status: string;
  checked_in: boolean;
  team_data?: {
    team_name?: string;
    members?: { fullName: string; email: string; checked_in: boolean }[];
  } | null;
}

export default function TicketClient({
  ticket,
  invalid,
}: {
  ticket?: TicketData;
  invalid?: boolean;
}) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadTicketImage = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `MSC_Ticket_${ticket?.hash_payload.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download ticket image:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (invalid || !ticket) {
    return (
      <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '40px', textAlign: 'center', boxShadow: 'var(--shadow-rest)' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
            Invalid Ticket Identifier
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
            The provided ticket payload could not be verified in the MSC registration ledger. Check the link or search with your registered email.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/ticket" className="fluent-btn fluent-btn-primary">
              Look Up Ticket by Email
            </Link>
            <Link href="/" className="fluent-btn fluent-btn-secondary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checkinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/checkin/${ticket.hash_payload}`;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        {/* Navigation back */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/events" style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Back to Events
          </Link>
          <button
            onClick={downloadTicketImage}
            disabled={downloading}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <Download size={14} /> {downloading ? 'Generating PNG...' : 'Download Image'}
          </button>
        </div>

        {/* WALLET-STYLE DIGITAL TICKET CARD */}
        <div
          ref={ticketRef}
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lift)',
            overflow: 'hidden',
          }}
        >
          {/* Ticket Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0067b8 0%, #004c87 100%)',
              color: '#ffffff',
              padding: 'clamp(16px, 4vw, 24px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85 }}>
                Official Admission Pass &bull; Chapter &apos;26
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', margin: '4px 0 0 0' }}>
                Microsoft Student Community
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  background: ticket.checked_in ? '#0e7c41' : 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {ticket.checked_in ? 'Checked In' : 'Confirmed'}
              </span>
            </div>
          </div>

          {/* Ticket Body */}
          <div style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
              {ticket.event_title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--brand)" />
                <span>{new Date(ticket.event_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--brand)" />
                <span>{ticket.event_location}</span>
              </div>
            </div>

            {/* Perforated Divider */}
            <div
              style={{
                borderBottom: '2px dashed var(--border-strong)',
                margin: '24px -32px',
                position: 'relative',
              }}
            />

            {/* QR Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
              <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <QRCodeSVG
                  value={checkinUrl}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'center', maxWidth: '100%', padding: '0 8px' }}>
                {ticket.hash_payload}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                Present this scannable QR code at the entrance turnstile
              </span>
            </div>

            {/* Registrant / Team Details */}
            <div
              style={{
                background: 'var(--bg-soft)',
                padding: '20px',
                borderRadius: 'var(--radius-sm)',
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: '16px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                  Lead Attendee
                </span>
                <strong style={{ color: 'var(--text-strong)' }}>{ticket.lead_name}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                  Email Address
                </span>
                <span style={{ color: 'var(--text-body)' }}>{ticket.lead_email}</span>
              </div>

              {ticket.team_data && ticket.team_data.team_name && (
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Team Roster ({ticket.team_data.team_name})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ticket.team_data.members?.map((m, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                        }}
                      >
                        {m.fullName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Footer */}
          <div
            style={{
              background: 'var(--bg-soft)',
              borderTop: '1px solid var(--border)',
              padding: '14px 24px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="var(--brand)" />
              <span>Cryptographically Secured Ticket Pass</span>
            </div>
            <span>SRM University AP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
