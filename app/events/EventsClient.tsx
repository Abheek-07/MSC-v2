'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Sparkles, Image as ImageIcon, ArrowRight, ExternalLink } from 'lucide-react';
import { EventItem } from '@/lib/data/mock-fallback';

export default function EventsClient({ events }: { events: EventItem[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Hackathons', 'Workshops', 'Webinars', 'Speaker Sessions'];

  // Spotlight the closest upcoming event
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const featuredEvent = upcomingEvents[0] || events[0];

  const filteredEvents =
    activeCategory === 'All'
      ? events
      : events.filter((e) => e.type.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Flagship Engineering &bull; Chapter &apos;26
          </span>
          <h1 style={{ fontSize: '44px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
            Events Directory
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
            Explore hackathons, workshops, bootcamps, and technical conferences hosted by Microsoft Student Community at SRM University AP.
          </p>
        </div>

        {/* 3. FEATURED EVENT BANNER (Automatically spotlights closest upcoming event) */}
        {featuredEvent && (
          <div
            style={{
              background: 'linear-gradient(135deg, #0e1726 0%, #05111c 100%)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(0, 103, 184, 0.4)',
              boxShadow: 'var(--shadow-lift)',
              padding: '44px',
              marginBottom: '48px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 103, 184, 0.25)',
                  border: '1px solid rgba(0, 103, 184, 0.5)',
                  color: '#58a6ff',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={14} /> Spotlight Upcoming Event
              </div>

              <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
                {featuredEvent.title}
              </h2>

              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginBottom: '28px' }}>
                {featuredEvent.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  marginBottom: '28px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#58a6ff" />
                  <span>{new Date(featuredEvent.date_start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#58a6ff" />
                  <span>{featuredEvent.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} color="#58a6ff" />
                  <span>{featuredEvent.max_capacity} Seats</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  href={`/events/${featuredEvent.slug}`}
                  className="fluent-btn fluent-btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  Enter Event Portal &rarr;
                </Link>
                {featuredEvent.slug === 'synora-26' && (
                  <Link
                    href="/custom-events/synora"
                    className="fluent-btn fluent-btn-secondary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    View F1 Microsite <ExternalLink size={13} />
                  </Link>
                )}
                <Link
                  href="/gallery"
                  style={{ color: '#58a6ff', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ImageIcon size={14} /> View Photo Gallery
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. CATEGORY FILTER TABS */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: isActive ? 'var(--brand)' : 'var(--surface)',
                  color: isActive ? '#ffffff' : 'var(--text-body)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 4. EVENT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
          {filteredEvents.map((evt) => {
            const isCompleted = evt.status === 'completed';
            const priceLabel =
              evt.form_requirements.event_pricing === 'paid'
                ? `₹${evt.form_requirements.registration_fee}`
                : 'Free Entry';

            return (
              <div key={evt.id} className="fluent-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={evt.image_url}
                    alt={evt.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                    <span
                      style={{
                        background: isCompleted ? '#616161' : 'var(--brand)',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {isCompleted ? 'Archived / Completed' : 'Active / Upcoming'}
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

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '10px' }}>
                    {evt.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                    {evt.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--brand)" />
                      <span>{new Date(evt.date_start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--brand)" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  {/* Actions: View Portal and Gallery */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link
                      href={`/events/${evt.slug}`}
                      className="fluent-btn fluent-btn-primary"
                      style={{ flex: 1, padding: '8px 14px', fontSize: '13px' }}
                    >
                      View Portal &rarr;
                    </Link>
                    <Link
                      href="/gallery"
                      className="fluent-btn fluent-btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '13px', gap: '4px' }}
                    >
                      <ImageIcon size={14} /> Gallery
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
