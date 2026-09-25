'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Image as ImageIcon, ExternalLink, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { EventItem } from '@/lib/data/mock-fallback';

export default function EventsClient({ events }: { events: EventItem[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Hackathons', 'Workshops', 'Webinars', 'Speaker Sessions'];

  // Spotlight the closest upcoming event or first event
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const featuredEvent = upcomingEvents[0] || events[0];

  const filteredEvents =
    activeCategory === 'All'
      ? events
      : events.filter((e) => e.type.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header with Microsoft 4-Color Eyebrow */}
        <div style={{ marginBottom: '40px', maxWidth: '840px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--text-body)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 6px)',
                gridTemplateRows: 'repeat(2, 6px)',
                gap: '2px',
                flexShrink: 0,
              }}
            >
              <div style={{ background: '#f25022', borderRadius: '1px' }} />
              <div style={{ background: '#7fba00', borderRadius: '1px' }} />
              <div style={{ background: '#00a4ef', borderRadius: '1px' }} />
              <div style={{ background: '#ffb900', borderRadius: '1px' }} />
            </div>
            <span>MICROSOFT TECH COMMUNITY &bull; CAMPUS EVENTS &amp; HACKATHONS</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 44px)',
              fontWeight: 600,
              color: 'var(--text-strong)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Events &amp; Innovation Sprints
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            Explore upcoming hackathons, technical workshops, cloud deep dives, and developer conferences hosted by Microsoft Student Community at SRM University-AP.
          </p>
        </div>

        {/* FEATURED EVENT SHOWCASE (Microsoft Fluent 2 Hero Card) */}
        {featuredEvent && (() => {
          const startDate = new Date(featuredEvent.date_start);
          const isValidDate = !isNaN(startDate.getTime());
          const monthShort = isValidDate ? startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'UPCOMING';
          const dayNum = isValidDate ? startDate.toLocaleDateString('en-US', { day: '2-digit' }) : '01';
          const isPaid = featuredEvent.form_requirements?.event_pricing === 'paid';
          const priceLabel = isPaid ? `₹${featuredEvent.form_requirements?.registration_fee || 0}` : 'Free Entry';
          const isCompleted = featuredEvent.status === 'completed';

          return (
            <div
              style={{
                borderRadius: '8px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-rest)',
                background: 'var(--surface)',
                overflow: 'hidden',
                marginBottom: '48px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
              }}
            >
              {/* Event Image Column */}
              <div
                style={{
                  position: 'relative',
                  minHeight: '280px',
                  background: 'var(--bg-soft)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={featuredEvent.image_url}
                  alt={featuredEvent.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                {/* Floating Date Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{monthShort}</span>
                  <span>{dayNum}</span>
                </div>

                {/* Floating Price Tag */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    background: 'rgba(0, 103, 184, 0.92)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {priceLabel}
                </div>
              </div>

              {/* Event Information Column */}
              <div
                style={{
                  padding: 'clamp(24px, 4vw, 36px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: isCompleted ? 'var(--bg-soft)' : 'var(--success-bg)',
                      color: isCompleted ? 'var(--text-muted)' : 'var(--success)',
                      border: `1px solid ${isCompleted ? 'var(--border)' : 'rgba(14, 124, 65, 0.2)'}`,
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {isCompleted ? 'Completed' : 'Registration Open'}
                  </span>
                  {featuredEvent.type && (
                    <span
                      style={{
                        background: 'var(--brand-soft)',
                        color: 'var(--brand)',
                        border: '1px solid rgba(0, 103, 184, 0.2)',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {featuredEvent.type.toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>&bull; Flagship Showcase</span>
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(22px, 3.5vw, 30px)',
                    fontWeight: 600,
                    color: 'var(--text-strong)',
                    marginBottom: '10px',
                    lineHeight: 1.25,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {featuredEvent.title}
                </h2>

                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginBottom: '20px',
                  }}
                >
                  {featuredEvent.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '13px',
                    color: 'var(--text-body)',
                    marginBottom: '28px',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="var(--brand)" />
                    <span>
                      {startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} color="var(--brand)" />
                    <span>{featuredEvent.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} color="var(--brand)" />
                    <span>{featuredEvent.max_capacity} Confirmed Seats Available</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    href={`/events/${featuredEvent.slug}`}
                    className="fluent-btn fluent-btn-primary"
                    style={{
                      padding: '10px 22px',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      backgroundColor: 'var(--brand)',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    Enter Event Portal <ArrowRight size={14} />
                  </Link>
                  {featuredEvent.slug === 'synora-26' && (
                    <Link
                      href="/custom-events/synora"
                      className="fluent-btn fluent-btn-secondary"
                      style={{
                        padding: '10px 18px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      View F1 Microsite <ExternalLink size={13} />
                    </Link>
                  )}
                  <Link
                    href="/gallery"
                    style={{
                      color: 'var(--brand)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginLeft: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <ImageIcon size={15} /> Event Gallery
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MICROSOFT PIVOT CATEGORY TABS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0',
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count =
              cat === 'All'
                ? events.length
                : events.filter((e) => e.type.toLowerCase().includes(cat.toLowerCase())).length;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                  padding: '10px 16px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'var(--brand-soft)' : 'var(--bg-soft)',
                    color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* EVENT DIRECTORY CARDS GRID */}
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '16px', color: 'var(--text-strong)', fontWeight: 600, marginBottom: '6px' }}>
              No events found under &ldquo;{activeCategory}&rdquo;
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Try selecting &ldquo;All&rdquo; or explore other technical categories.
            </p>
            <button
              onClick={() => setActiveCategory('All')}
              className="fluent-btn fluent-btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}
            >
              Reset Category Filter
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '24px',
            }}
          >
            {filteredEvents.map((evt) => {
              const isCompleted = evt.status === 'completed';
              const isPaid = evt.form_requirements?.event_pricing === 'paid';
              const priceLabel = isPaid ? `₹${evt.form_requirements?.registration_fee || 0}` : 'Free Entry';
              const evtDate = new Date(evt.date_start);
              const isDateValid = !isNaN(evtDate.getTime());
              const formattedDate = isDateValid
                ? evtDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Date to be announced';

              return (
                <div
                  key={evt.id}
                  className="fluent-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-rest)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ height: '190px', position: 'relative', overflow: 'hidden', background: 'var(--bg-soft)' }}>
                    <img
                      src={evt.image_url || '/images/hero-bg.png'}
                      alt={evt.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Top Badges */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          background: isCompleted ? 'rgba(50, 49, 48, 0.85)' : 'rgba(14, 124, 65, 0.90)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                      <span
                        style={{
                          background: 'rgba(0, 0, 0, 0.70)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {evt.type}
                      </span>
                    </div>

                    {/* Price pill */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: '#ffffff',
                        color: 'var(--text-strong)',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                      }}
                    >
                      {priceLabel}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'var(--text-strong)',
                        marginBottom: '8px',
                        lineHeight: 1.3,
                      }}
                    >
                      {evt.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                        flex: 1,
                        marginBottom: '18px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {evt.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--text-body)',
                        marginBottom: '20px',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="var(--brand)" />
                        <span>{formattedDate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--brand)" />
                        <span>{evt.location}</span>
                      </div>
                    </div>

                    {/* Microsoft Action Button Row */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/events/${evt.slug}`}
                        className="fluent-btn fluent-btn-primary"
                        style={{
                          flex: 1,
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          backgroundColor: 'var(--brand)',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        View Portal <ArrowRight size={13} />
                      </Link>
                      <Link
                        href="/gallery"
                        className="fluent-btn fluent-btn-secondary"
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="View photo archives"
                      >
                        <ImageIcon size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
