'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Award,
  Share2,
} from 'lucide-react';
import { EventItem } from '@/lib/data/mock-fallback';

interface MemberData {
  fullName: string;
  email: string;
  regNum: string;
  branch: string;
  year: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EventDetailClient({ event }: { event: EventItem }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'agenda' | 'speakers' | 'teams'>('details');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [isInternalStudent, setIsInternalStudent] = useState(true);
  const [isTeamRegistration, setIsTeamRegistration] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [lookingForMembers, setLookingForMembers] = useState(false);

  // Lead registrant
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadRegNum, setLeadRegNum] = useState('');
  const [leadBranch, setLeadBranch] = useState('CSE');
  const [leadYear, setLeadYear] = useState('2nd Year');
  const [collegeName, setCollegeName] = useState('SRM University AP');

  // Additional team members
  const maxTeamMembers = (event.form_requirements.max_team_size || 4) - 1;
  const [members, setMembers] = useState<MemberData[]>([]);

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

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const idempotencyKey = crypto.randomUUID();

    const payload = {
      event_id: event.id,
      lead_email: leadEmail,
      idempotency_key: idempotencyKey,
      form_data: {
        is_internal: isInternalStudent,
        college_name: isInternalStudent ? 'SRM University AP' : collegeName,
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
              ...members.map((m) => ({
                ...m,
                checked_in: false,
              })),
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

      // If status is confirmed (free event), redirect to ticket
      if (data.status === 'confirmed') {
        router.push(`/ticket/${data.hash_payload}`);
        return;
      }

      // If status is pending_payment, initiate Razorpay checkout
      if (data.status === 'pending_payment') {
        initiateRazorpayPayment(data.registration_id, data.hash_payload, idempotencyKey);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = async (
    registrationId: string,
    hashPayload: string,
    idempotencyKey: string
  ) => {
    try {
      // 1. Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      // 2. Create order on server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          registration_id: registrationId,
          idempotency_key: idempotencyKey,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create payment order.');
      }

      // 3. Open Razorpay modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: 'INR',
        name: 'MSC SRM University AP',
        description: `Registration for ${event.title}`,
        order_id: orderData.order_id,
        prefill: {
          name: leadName,
          email: leadEmail,
          contact: leadPhone,
        },
        theme: {
          color: '#0067b8',
        },
        handler: async function (response: any) {
          // Dual verification on server
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            router.push(`/ticket/${hashPayload}`);
          } else {
            setErrorMsg('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  const isFree = event.form_requirements.event_pricing !== 'paid';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 100px 0' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/events" style={{ color: 'var(--brand)' }}>
            &larr; Back to Events
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{event.title}</span>
        </div>

        {/* Hero Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            overflow: 'hidden',
            marginBottom: '36px',
          }}
        >
          {event.banner_url && (
            <div style={{ height: '240px', width: '100%', position: 'relative', overflow: 'hidden' }}>
              <img
                src={event.banner_url}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{ padding: '36px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span className="fluent-badge badge-info">{event.type}</span>
              <span className={`fluent-badge ${event.status === 'upcoming' ? 'badge-success' : 'badge-warning'}`}>
                {event.status === 'upcoming' ? 'Registration Open' : 'Event Concluded'}
              </span>
              <span className="fluent-badge" style={{ background: 'var(--bg-soft)', color: 'var(--text-strong)' }}>
                {isFree ? 'Free Entry' : `₹${event.form_requirements.registration_fee}`}
              </span>
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '14px' }}>
              {event.title}
            </h1>

            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '800px', marginBottom: '28px' }}>
              {event.description}
            </p>

            {/* Quick Metadata Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                padding: '20px',
                background: 'var(--bg-soft)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '28px',
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
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="var(--brand)" /> Location
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-strong)' }}>
                  {event.location}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} color="var(--brand)" /> Capacity Limit
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
                  {event.form_requirements.provide_certificates ? 'Verified Digital PNG' : 'None'}
                </strong>
              </div>
            </div>

            {/* Registration CTA Trigger */}
            {event.registration_open ? (
              <button
                onClick={() => setIsRegistering(true)}
                className="fluent-btn fluent-btn-primary"
                style={{ padding: '12px 32px', fontSize: '16px' }}
              >
                Register For This Event &rarr;
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Registration is currently closed for this event.
                </span>
                {event.form_requirements.provide_certificates && (
                  <Link
                    href={`/events/${event.slug}/certificate`}
                    className="fluent-btn fluent-btn-secondary"
                  >
                    Download Certificate
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid var(--border)',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: activeTab === 'details' ? 600 : 400,
              color: activeTab === 'details' ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: activeTab === 'details' ? '2px solid var(--brand)' : 'none',
              marginBottom: '-2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Overview &amp; Guidelines
          </button>

          {event.form_requirements.agenda && (
            <button
              onClick={() => setActiveTab('agenda')}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'agenda' ? 600 : 400,
                color: activeTab === 'agenda' ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: activeTab === 'agenda' ? '2px solid var(--brand)' : 'none',
                marginBottom: '-2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Schedule &amp; Agenda
            </button>
          )}

          {event.form_requirements.speakers && (
            <button
              onClick={() => setActiveTab('speakers')}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'speakers' ? 600 : 400,
                color: activeTab === 'speakers' ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: activeTab === 'speakers' ? '2px solid var(--brand)' : 'none',
                marginBottom: '-2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Mentors &amp; Speakers
            </button>
          )}

          {event.form_requirements.allow_teams && (
            <button
              onClick={() => setActiveTab('teams')}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'teams' ? 600 : 400,
                color: activeTab === 'teams' ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: activeTab === 'teams' ? '2px solid var(--brand)' : 'none',
                marginBottom: '-2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Team Matchmaking
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <div className="fluent-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '16px' }}>
                Requirements &amp; Rules
              </h3>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.5 }}>
                <li>Carry your official University / College identity card to the venue for QR scanning.</li>
                <li>Laptops and chargers required for hands-on workshop modules and sprint hacking.</li>
                <li>Free WiFi credentials and Azure test subscription credits will be provisioned on-site.</li>
                <li>Tickets with unique digital QR codes will be dispatched immediately upon registration.</li>
              </ul>
            </div>

            <div className="fluent-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '16px' }}>
                Certificates &amp; Accreditation
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '20px' }}>
                All participants completing the event and successfully checking in through our on-site QR scanner receive
                an official MSC Chapter &apos;26 certificate signed by faculty advisors Dr. Murali Krishna Enduri and Dr. CV Tomy.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand)', fontSize: '13px', fontWeight: 600 }}>
                <ShieldCheck size={18} /> Official Institutional Verification
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Agenda */}
        {activeTab === 'agenda' && event.form_requirements.agenda && (
          <div className="fluent-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '24px' }}>
              Event Timeline &amp; Track Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {event.form_requirements.agenda.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ minWidth: '100px', fontSize: '14px', fontWeight: 700, color: 'var(--brand)' }}>
                    {item.time}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '4px' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Speakers */}
        {activeTab === 'speakers' && event.form_requirements.speakers && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {event.form_requirements.speakers.map((s, idx) => (
              <div key={idx} className="fluent-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '4px' }}>
                  {s.name}
                </h4>
                <span style={{ fontSize: '13px', color: 'var(--brand)', display: 'block', marginBottom: '8px' }}>
                  {s.title}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.company}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Matchmaking */}
        {activeTab === 'teams' && (
          <div className="fluent-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  Team Matchmaking Guild
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Connect with registered teams currently looking for collaborators, designers, or backend engineers.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsTeamRegistration(true);
                  setLookingForMembers(true);
                  setIsRegistering(true);
                }}
                className="fluent-btn fluent-btn-secondary"
              >
                Create Team &amp; List Here
              </button>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', margin: '0 0 12px 0' }}>
                Teams with open slots will appear here live. Register your team and enable &quot;Looking for members&quot;
                to invite peers directly via shareable invite links!
              </p>
            </div>
          </div>
        )}

        {/* REGISTRATION MODAL */}
        {isRegistering && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-lift)',
                padding: '36px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Participant Registration
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)' }}>
                    {event.title}
                  </h2>
                </div>
                <button
                  onClick={() => setIsRegistering(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  &times;
                </button>
              </div>

              {errorMsg && (
                <div style={{ padding: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegistrationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Student Status Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Student Institutional Status
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
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
                      SRM University AP Student
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
                      External College Student
                    </button>
                  </div>
                </div>

                {!isInternalStudent && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      College / University Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="fluent-input"
                    />
                  </div>
                )}

                {/* 2. Team vs Individual */}
                {event.form_requirements.allow_teams && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      Registration Mode
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
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
                        Individual Builder
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
                        Team (Up to {event.form_requirements.max_team_size || 4} members)
                      </button>
                    </div>
                  </div>
                )}

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
                      <span>List our team on Matchmaking Guild (Looking for members)</span>
                    </label>
                  </div>
                )}

                {/* 3. Lead Participant Details */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-strong)' }}>
                    {isTeamRegistration ? 'Team Leader Details' : 'Participant Details'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
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
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
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
                        placeholder="e.g. AP21110010123"
                        value={leadRegNum}
                        onChange={(e) => setLeadRegNum(e.target.value)}
                        className="fluent-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Department / Branch
                      </label>
                      <input
                        type="text"
                        value={leadBranch}
                        onChange={(e) => setLeadBranch(e.target.value)}
                        className="fluent-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Year of Study
                      </label>
                      <input
                        type="text"
                        value={leadYear}
                        onChange={(e) => setLeadYear(e.target.value)}
                        className="fluent-input"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Teammates Form Fields */}
                {isTeamRegistration && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-strong)' }}>
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
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-soft)',
                          padding: '16px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '12px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '12px' }}>Teammate #{idx + 2}</strong>
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
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
                            placeholder="Email Address"
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

                {/* Submit Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="fluent-btn fluent-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="fluent-btn fluent-btn-primary"
                    style={{ padding: '10px 28px' }}
                  >
                    {loading
                      ? 'Processing...'
                      : isFree
                      ? 'Confirm Free Registration'
                      : `Proceed to Pay ₹${event.form_requirements.registration_fee}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
