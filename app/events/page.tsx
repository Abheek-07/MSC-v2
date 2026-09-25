import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Sparkles, Users, ArrowRight, ExternalLink } from 'lucide-react';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';

export const metadata = {
  title: 'Events & Hackathons — Microsoft Student Community | SRM University AP',
  description:
    'Explore hackathons, workshops, bootcamps, and technical conferences hosted by Microsoft Student Community at SRM University AP.',
};

export default async function EventsPage() {
  const events = FALLBACK_EVENTS;
  const synora = events.find((e) => e.slug === 'synora-26') || events[0];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Flagship Engineering &bull; Chapter &apos;26
          </span>
          <h1 style={{ fontSize: '44px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
            Events &amp; Hackathons
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
            Explore hackathons, workshops, bootcamps, and technical conferences hosted by Microsoft Student Community at SRM University AP.
          </p>
        </div>

        {/* FLAGSHIP SPOTLIGHT (SYNORA Hackathon Pattern) */}
        {synora && (
          <div
            style={{
              background: 'linear-gradient(135deg, #0e1726 0%, #05111c 100%)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(0, 103, 184, 0.4)',
              boxShadow: 'var(--shadow-lift)',
              padding: '48px',
              marginBottom: '60px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(225, 6, 0, 0.2)',
                  border: '1px solid #e10600',
                  color: '#ff4d4d',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '18px',
                }}
              >
                <Sparkles size={14} /> Flagship Hackathon Spotlight
              </div>

              <h2 style={{ fontSize: '38px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                {synora.title}
              </h2>

              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginBottom: '32px' }}>
                {synora.description}
              </p>

              {/* Spotlight metrics row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '20px 0',
                  marginBottom: '32px',
                }}
              >
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffb900', display: 'block' }}>
                    &#8377; 1,50,000+
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                    Prize Bounty
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                    36 Hours
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                    Non-Stop Sprint
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                    Pan-India
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                    Freshers &amp; All Years
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#58a6ff', display: 'block' }}>
                    4 Members
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                    Max Team Size
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  href={`/events/${synora.slug}`}
                  className="fluent-btn fluent-btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px' }}
                >
                  Register Now &rarr;
                </Link>
                <Link
                  href="/custom-events/synora"
                  className="fluent-btn fluent-btn-secondary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  View F1 Microsite <ExternalLink size={14} />
                </Link>
                <a
                  href="https://discord.gg/microsoft"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#58a6ff', fontSize: '13px', marginLeft: '8px' }}
                >
                  Join Discord Guild &rarr;
                </a>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ALL EVENTS GRID */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)' }}>
              All Events &amp; Workshops
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="fluent-badge badge-info">Live Directory</span>
              <span className="fluent-badge badge-success">Free Tier Verification</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {events.map((evt) => {
              const isPast = evt.status === 'completed';
              const priceLabel = evt.form_requirements.event_pricing === 'paid'
                ? `₹${evt.form_requirements.registration_fee}`
                : 'Free Entry';

              return (
                <div key={evt.id} className="fluent-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Image cover */}
                  <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={evt.image_url}
                      alt={evt.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          background: isPast ? '#616161' : 'var(--brand)',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {evt.status}
                      </span>
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.7)',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {evt.type}
                      </span>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: '#ffffff',
                        color: 'var(--text-strong)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      {priceLabel}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '10px' }}>
                      {evt.title}
                    </h3>

                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--brand)" />
                        <span>
                          {new Date(evt.date_start).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--brand)" />
                        <span>{evt.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="var(--brand)" />
                        <span>Capacity: {evt.max_capacity} Seats</span>
                      </div>
                    </div>

                    <Link
                      href={`/events/${evt.slug}`}
                      className="fluent-btn fluent-btn-primary"
                      style={{ width: '100%' }}
                    >
                      {isPast ? 'View Event Archive & Certificates' : 'Event Portal & Register'} &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
