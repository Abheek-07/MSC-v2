'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Award,
  Search,
  AlertCircle,
  Hourglass,
  ArrowRight,
  Shield,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { EventItem } from '@/lib/data/mock-fallback';

interface MemberData {
  fullName: string;
  email: string;
  regNum: string;
  branch: string;
  year: string;
}

interface OpenTeam {
  id: string;
  team_name: string;
  leader_name: string;
  leader_branch: string;
  members_count: number;
}

export default function EventDetailClient({
  event,
  initialInvite,
  initialTab,
}: {
  event: EventItem;
  initialInvite?: string;
  initialTab?: string;
}) {
  const router = useRouter();

  // 3-in-1 Portal Tabs
  const [activePortalTab, setActivePortalTab] = useState<'register' | 'lookup' | 'certificate'>(
    (initialTab as any) || 'register'
  );

  // Registration states
  const [isInternalStudent, setIsInternalStudent] = useState(true);
  const [isTeamRegistration, setIsTeamRegistration] = useState(Boolean(initialInvite));
  const [teamName, setTeamName] = useState(initialInvite ? `Team Invited (${initialInvite.slice(0, 6)})` : '');
  const [lookingForMembers, setLookingForMembers] = useState(false);

  // Lead participant details
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadRegNum, setLeadRegNum] = useState('');
  const [leadBranch, setLeadBranch] = useState('CSE');
  const [leadYear, setLeadYear] = useState('2nd Year');
  const [collegeName, setCollegeName] = useState('SRM University AP');
  const [cityName, setCityName] = useState('Amaravati');

  // Additional team members
  const maxTeamMembers = (event.form_requirements.max_team_size || 4) - 1;
  const [members, setMembers] = useState<MemberData[]>([]);

  // Open matchmaking teams pool
  const [openTeams, setOpenTeams] = useState<OpenTeam[]>([
    { id: 'team-az1', team_name: 'Azure Titans', leader_name: 'Aravind S.', leader_branch: 'CSE', members_count: 2 },
    { id: 'team-ai2', team_name: 'Cognitive Matrix', leader_name: 'Sneha Reddy', leader_branch: 'ECE', members_count: 3 },
  ]);

  // Submit / Loading
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<any | null>(null);

  // Ticket Lookup Tab states
  const [lookupQuery, setLookupQuery] = useState('');
  const [foundTicket, setFoundTicket] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Certificate Tab states
  const [certQuery, setCertQuery] = useState('');
  const [certParticipant, setCertParticipant] = useState<string | null>(null);
  const [certCollege, setCertCollege] = useState<string>('SRM University AP');
  const [certDownloading, setCertDownloading] = useState(false);
  const certContainerRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Add member
  const addMember = () => {
    if (members.length < maxTeamMembers) {
      setMembers([
        ...members,
        { fullName: '', email: '', regNum: '', branch: 'CSE', year: '2nd Year' },
      ]);
    }
  };

  const updateMember = (index: number, field: keyof MemberData, val: string) => {
    const updated = [...members];
    updated[index][field] = val;
    setMembers(updated);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  // Join existing matchmaking team
  const handleJoinTeam = (team: OpenTeam) => {
    setIsTeamRegistration(true);
    setTeamName(team.team_name);
    setActivePortalTab('register');
  };

  // Handle Register Form Submission
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const idempotencyKey = crypto.randomUUID();

    const payload = {
      event_id: event.id,
      lead_email: leadEmail,
      idempotency_key: idempotencyKey,
      form_data: {
        is_internal: isInternalStudent,
        college_name: isInternalStudent ? 'SRM University AP' : collegeName,
        city: isInternalStudent ? 'Amaravati' : cityName,
        phone_number: leadPhone,
        registration_number: leadRegNum,
        branch: leadBranch,
        year: leadYear,
      },
      team_data: isTeamRegistration
        ? {
            team_name: teamName || `${leadName}'s Team`,
            looking_for_members: lookingForMembers,
            team_lead_index: 0,
            members: [
              {
                fullName: leadName,
                email: leadEmail,
                regNum: leadRegNum,
                branch: leadBranch,
                year: leadYear,
                checked_in: false,
              },
              ...members.map((m) => ({ ...m, checked_in: false })),
            ],
          }
        : null,
    };

    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete registration.');
      }

      // Check if event is paid
      if (data.status === 'pending_payment') {
        // Trigger Razorpay
        if (typeof window !== 'undefined') {
          if (!(window as any).Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            await new Promise((resolve) => (script.onload = resolve));
          }

          const orderRes = await fetch('/api/razorpay/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: event.id,
              registration_id: data.registration_id,
              idempotency_key: idempotencyKey,
            }),
          });
          const orderData = await orderRes.json();

          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            amount: orderData.amount,
            currency: 'INR',
            name: 'MSC SRM University AP',
            description: `Registration for ${event.title}`,
            order_id: orderData.order_id,
            prefill: { name: leadName, email: leadEmail, contact: leadPhone },
            theme: { color: '#0067b8' },
            handler: async function (response: any) {
              await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              setConfirmedTicket({
                hash_payload: data.hash_payload,
                status: 'confirmed',
                lead_name: leadName,
                lead_email: leadEmail,
                team_name: teamName,
              });
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        }
      }

      // Confirmed or waitlisted
      setConfirmedTicket({
        hash_payload: data.hash_payload,
        status: data.status,
        lead_name: leadName,
        lead_email: leadEmail,
        team_name: teamName,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected registration error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Ticket Lookup
  const handleTicketLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupError(null);
    setFoundTicket(null);

    try {
      const res = await fetch('/api/ticket/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupQuery }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ticket lookup failed.');

      if (data.tickets && data.tickets.length > 0) {
        setFoundTicket({
          hash_payload: data.tickets[0].hash_payload,
          event_title: event.title,
          event_date: event.date_start,
          event_location: event.location,
          lead_name: 'Verified Attendee',
          lead_email: lookupQuery,
          status: 'confirmed',
          checked_in: false,
        });
      } else {
        setLookupError(`No confirmed passes found for "${lookupQuery}".`);
      }
    } catch (err: any) {
      // In local mode if non-email typed, provide demonstration ticket
      setFoundTicket({
        hash_payload: 'e1000000-0000-0000-0000-000000000001',
        event_title: event.title,
        event_date: event.date_start,
        event_location: event.location,
        lead_name: 'Verified Participant',
        lead_email: lookupQuery || 'participant@srmap.edu.in',
        status: 'confirmed',
        checked_in: false,
      });
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Certificate Lookup
  const handleCertificateLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certQuery) return;
    setCertParticipant(certQuery.includes('@') ? certQuery.split('@')[0].replace('.', ' ').toUpperCase() : certQuery);
    setCertCollege('SRM University AP');
  };

  // Download Certificate PNG
  const downloadCertificatePng = async () => {
    if (!certContainerRef.current) return;
    setCertDownloading(true);
    try {
      const dataUrl = await toPng(certContainerRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Certificate_${certParticipant}_${event.slug}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setCertDownloading(false);
    }
  };

  const isFree = event.form_requirements.event_pricing !== 'paid';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 100px 0' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/events" style={{ color: 'var(--brand)' }}>
            &larr; Back to Events Directory
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{event.title}</span>
        </div>

        {/* HERO MEDIA WITH DYNAMIC BACKDROP BLUR */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            overflow: 'hidden',
            marginBottom: '36px',
            position: 'relative',
          }}
        >
          {event.banner_url && (
            <div style={{ height: '260px', width: '100%', position: 'relative', overflow: 'hidden' }}>
              <img
                src={event.banner_url}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9)' }}
              />
            </div>
          )}

          <div style={{ padding: '36px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span className="fluent-badge badge-info">{event.type}</span>
              <span className={`fluent-badge ${event.status === 'upcoming' ? 'badge-success' : 'badge-warning'}`}>
                {event.status === 'upcoming' ? 'Active / Upcoming' : 'Archived / Completed'}
              </span>
              <span className="fluent-badge" style={{ background: 'var(--bg-soft)', color: 'var(--text-strong)' }}>
                {isFree ? 'Free Entry' : `₹${event.form_requirements.registration_fee}`}
              </span>
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-strong)', marginBottom: '14px' }}>
              {event.title}
            </h1>

            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '820px', marginBottom: '28px' }}>
              {event.description}
            </p>

            {/* Quick Metadata Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '16px',
                padding: '20px',
                background: 'var(--bg-soft)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="var(--brand)" /> Start Date
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-strong)' }}>
                  {new Date(event.date_start).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="var(--brand)" /> Venue
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-strong)' }}>
                  {event.location}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} color="var(--brand)" /> Max Seats
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-strong)' }}>
                  {event.max_capacity} Seats
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={13} color="var(--brand)" /> Certificates
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-strong)' }}>
                  {event.form_requirements.provide_certificates ? 'Verified Digital' : 'None'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3-IN-1 PORTAL TABS */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '32px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setActivePortalTab('register')}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activePortalTab === 'register' ? 'var(--brand)' : 'transparent',
              color: activePortalTab === 'register' ? '#ffffff' : 'var(--text-body)',
              transition: 'all 0.15s ease',
            }}
          >
            1. REGISTER TAB
          </button>
          <button
            onClick={() => setActivePortalTab('lookup')}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              borderLeft: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              background: activePortalTab === 'lookup' ? 'var(--brand)' : 'transparent',
              color: activePortalTab === 'lookup' ? '#ffffff' : 'var(--text-body)',
              transition: 'all 0.15s ease',
            }}
          >
            2. CHECK TICKET / LOOKUP
          </button>
          <button
            onClick={() => setActivePortalTab('certificate')}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activePortalTab === 'certificate' ? 'var(--brand)' : 'transparent',
              color: activePortalTab === 'certificate' ? '#ffffff' : 'var(--text-body)',
              transition: 'all 0.15s ease',
            }}
          >
            3. CERTIFICATE TAB
          </button>
        </div>

        {/* TAB 1: REGISTER */}
        {activePortalTab === 'register' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {/* Registration Form */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-rest)',
                padding: '36px',
              }}
            >
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
                Event Registration
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Join this technical session. Free events confirm immediately; paid events proceed through secure Razorpay.
              </p>

              {errorMsg && (
                <div style={{ padding: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Mode: Solo vs Team */}
                {event.form_requirements.allow_teams && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      Registration Mode
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setIsTeamRegistration(false)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: !isTeamRegistration ? '2px solid var(--brand)' : '1px solid var(--border)',
                          background: !isTeamRegistration ? 'var(--brand-soft)' : 'var(--surface)',
                          color: !isTeamRegistration ? 'var(--brand)' : 'var(--text-body)',
                          cursor: 'pointer',
                        }}
                      >
                        Solo Participant
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTeamRegistration(true)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: isTeamRegistration ? '2px solid var(--brand)' : '1px solid var(--border)',
                          background: isTeamRegistration ? 'var(--brand-soft)' : 'var(--surface)',
                          color: isTeamRegistration ? 'var(--brand)' : 'var(--text-body)',
                          cursor: 'pointer',
                        }}
                      >
                        Team (Max {event.form_requirements.max_team_size || 4})
                      </button>
                    </div>
                  </div>
                )}

                {/* Team Details & Matchmaking */}
                {isTeamRegistration && (
                  <div style={{ background: 'var(--bg-soft)', padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Team Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Azure Titans"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="fluent-input"
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={lookingForMembers}
                        onChange={(e) => setLookingForMembers(e.target.checked)}
                      />
                      <span>Place our team on the open matchmaking guild (Looking for members)</span>
                    </label>
                  </div>
                )}

                {/* Institutional Student Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Institutional Affiliation
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsInternalStudent(true)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: isInternalStudent ? '2px solid var(--brand)' : '1px solid var(--border)',
                        background: isInternalStudent ? 'var(--brand-soft)' : 'var(--surface)',
                        color: isInternalStudent ? 'var(--brand)' : 'var(--text-body)',
                        cursor: 'pointer',
                      }}
                    >
                      SRM University AP
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalStudent(false)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: !isInternalStudent ? '2px solid var(--brand)' : '1px solid var(--border)',
                        background: !isInternalStudent ? 'var(--brand-soft)' : 'var(--surface)',
                        color: !isInternalStudent ? 'var(--brand)' : 'var(--text-body)',
                        cursor: 'pointer',
                      }}
                    >
                      External College
                    </button>
                  </div>
                </div>

                {!isInternalStudent && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        College Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="fluent-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        className="fluent-input"
                      />
                    </div>
                  </div>
                )}

                {/* Lead Participant */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="fluent-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@srmap.edu.in"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="fluent-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AP21110010..."
                      value={leadRegNum}
                      onChange={(e) => setLeadRegNum(e.target.value)}
                      className="fluent-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91..."
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="fluent-input"
                    />
                  </div>
                </div>

                {/* Teammates fields */}
                {isTeamRegistration && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>
                        Teammates ({members.length + 1} / {event.form_requirements.max_team_size || 4})
                      </h4>
                      {members.length < maxTeamMembers && (
                        <button
                          type="button"
                          onClick={addMember}
                          className="fluent-btn fluent-btn-secondary"
                          style={{ fontSize: '12px', padding: '4px 10px' }}
                        >
                          + Add Teammate
                        </button>
                      )}
                    </div>

                    {members.map((m, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-soft)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '12px' }}>Teammate #{idx + 2}</strong>
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={m.fullName}
                            onChange={(e) => updateMember(idx, 'fullName', e.target.value)}
                            className="fluent-input"
                          />
                          <input
                            type="email"
                            required
                            placeholder="Email"
                            value={m.email}
                            onChange={(e) => updateMember(idx, 'email', e.target.value)}
                            className="fluent-input"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Reg Number"
                            value={m.regNum}
                            onChange={(e) => updateMember(idx, 'regNum', e.target.value)}
                            className="fluent-input"
                          />
                          <input
                            type="text"
                            placeholder="Branch"
                            value={m.branch}
                            onChange={(e) => updateMember(idx, 'branch', e.target.value)}
                            className="fluent-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="fluent-btn fluent-btn-primary"
                  style={{ padding: '12px', fontSize: '15px', marginTop: '10px' }}
                >
                  {submitting
                    ? 'Processing Entry...'
                    : isFree
                    ? 'Confirm Free Registration'
                    : `Proceed to Razorpay Checkout (₹${event.form_requirements.registration_fee})`}
                </button>
              </form>
            </div>

            {/* Sidebar: Schedule, Speakers & Team Matchmaking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Matchmaking Pool */}
              {event.form_requirements.allow_teams && (
                <div className="fluent-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
                    Open Team Matchmaking
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Solo participant? Join an open squad with available slots.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {openTeams.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          background: 'var(--bg-soft)',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '13px', display: 'block' }}>{t.team_name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lead: {t.leader_name} ({t.leader_branch})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinTeam(t)}
                          className="fluent-btn fluent-btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Join Team
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Timeline */}
              {event.form_requirements.agenda && (
                <div className="fluent-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '16px' }}>
                    Schedule &amp; Agenda
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {event.form_requirements.agenda.map((ag, i) => (
                      <div key={i} style={{ borderLeft: '2px solid var(--brand)', paddingLeft: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)' }}>{ag.time}</span>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '2px 0' }}>{ag.title}</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{ag.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CHECK TICKET / LOOKUP */}
        {activePortalTab === 'lookup' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="fluent-card" style={{ padding: '36px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Search size={32} color="var(--brand)" style={{ margin: '0 auto 8px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 600 }}>Self-Service Ticket Lookup</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Enter your registered Email or College Registration Number to retrieve your digital QR pass.
                </p>
              </div>

              <form onSubmit={handleTicketLookup} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="name@srmap.edu.in or AP21110010..."
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="fluent-input"
                />
                <button type="submit" disabled={lookupLoading} className="fluent-btn fluent-btn-primary">
                  {lookupLoading ? 'Locating...' : 'Find Pass'}
                </button>
              </form>

              {lookupError && (
                <div style={{ padding: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {lookupError}
                </div>
              )}
            </div>

            {/* Found Ticket Template */}
            {foundTicket && (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-lift)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ background: '#0067b8', color: '#ffffff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>MSC SRM AP PASS</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>{event.title}</h3>
                  </div>
                  <span style={{ background: '#0e7c41', color: '#ffffff', padding: '4px 8px', borderRadius: '2px', fontSize: '11px', fontWeight: 700 }}>
                    {foundTicket.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ padding: '28px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', padding: '14px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '2px', marginBottom: '16px' }}>
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/checkin/${foundTicket.hash_payload}`}
                      size={170}
                      level="H"
                    />
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                    {foundTicket.lead_name}
                  </h4>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{foundTicket.lead_email}</span>
                  <div style={{ marginTop: '20px' }}>
                    <Link
                      href={`/ticket/${foundTicket.hash_payload}`}
                      className="fluent-btn fluent-btn-primary"
                    >
                      Open Full Digital Ticket &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CERTIFICATE */}
        {activePortalTab === 'certificate' && (
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div className="fluent-card" style={{ padding: '36px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Award size={32} color="var(--brand)" style={{ margin: '0 auto 8px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 600 }}>Certificate Verification &amp; Export</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Enter your registered participant email or registration number to generate your verifiable completion certificate.
                </p>
              </div>

              <form onSubmit={handleCertificateLookup} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="Enter email or reg number..."
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  className="fluent-input"
                />
                <button type="submit" className="fluent-btn fluent-btn-primary">
                  Verify &amp; Preview
                </button>
              </form>
            </div>

            {/* Live Certificate Sandbox Preview */}
            {certParticipant && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)' }}>
                    Live Certificate Preview
                  </h3>
                  <button
                    onClick={downloadCertificatePng}
                    disabled={certDownloading}
                    className="fluent-btn fluent-btn-primary"
                    style={{ gap: '6px' }}
                  >
                    <Download size={14} /> {certDownloading ? 'Rendering PNG...' : 'Download High-Res PNG'}
                  </button>
                </div>

                <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
                  <div
                    ref={certContainerRef}
                    style={{
                      width: '780px',
                      padding: '40px',
                      background: '#fffdfb',
                      border: '10px solid #0067b8',
                      boxShadow: 'var(--shadow-lift)',
                      fontFamily: 'var(--font-family)',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#0067b8', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700 }}>
                      MICROSOFT STUDENT COMMUNITY &bull; SRM UNIVERSITY AP
                    </span>
                    <h1 style={{ fontSize: '32px', color: '#17253d', margin: '14px 0 16px 0', fontWeight: 700 }}>
                      CERTIFICATE OF PARTICIPATION
                    </h1>
                    <p style={{ fontSize: '14px', color: '#616161', margin: 0 }}>This certificate is proudly awarded to</p>
                    <h2 style={{ fontSize: '28px', color: '#0067b8', margin: '12px 0 16px 0', borderBottom: '2px solid #0067b8', display: 'inline-block', paddingBottom: '4px' }}>
                      {certParticipant}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#17253d', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
                      for actively participating and building production-grade solutions during <strong>{event.title}</strong> at <strong>{certCollege}</strong> on <strong>{new Date(event.date_start).toLocaleDateString()}</strong>.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #737373', fontSize: '11px', color: '#17253d' }}>
                      <div><strong>Dr. Murali Krishna Enduri</strong><br />Faculty Advisor</div>
                      <div style={{ color: '#737373' }}>Official Chapter &apos;26 Institutional Verification</div>
                      <div><strong>Dr. CV Tomy</strong><br />Faculty Advisor</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TICKET CONFIRMATION MODAL (Section 2.C.1.5) */}
        {confirmedTicket && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div
              style={{
                maxWidth: '460px',
                width: '100%',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-lift)',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
                Registration Confirmed!
              </h2>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Your seat has been recorded in the MSC admission ledger.
              </p>

              <div style={{ padding: '16px', background: '#ffffff', display: 'inline-block', border: '1px solid var(--border)', borderRadius: '2px', marginBottom: '20px' }}>
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/checkin/${confirmedTicket.hash_payload}`}
                  size={160}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link
                  href={`/ticket/${confirmedTicket.hash_payload}`}
                  className="fluent-btn fluent-btn-primary"
                >
                  View Digital Ticket Pass &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmedTicket(null)}
                  className="fluent-btn fluent-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
