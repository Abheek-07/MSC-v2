'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Calendar, MapPin, Users, Check, X, ShieldAlert } from 'lucide-react';
import { FALLBACK_EVENTS, EventItem } from '@/lib/data/mock-fallback';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>(FALLBACK_EVENTS);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTogglePublish = (id: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, is_published: !e.is_published } : e))
    );
  };

  const handleToggleRegistration = (id: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, registration_open: !e.registration_open } : e))
    );
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (editingEvent.id) {
      // Update
      setEvents(
        events.map((ev) => (ev.id === editingEvent.id ? ({ ...ev, ...editingEvent } as EventItem) : ev))
      );
    } else {
      // Create new
      const newEv: EventItem = {
        id: crypto.randomUUID(),
        title: editingEvent.title || 'Untitled Event',
        slug: (editingEvent.title || 'new-event').toLowerCase().replace(/\s+/g, '-'),
        description: editingEvent.description || '',
        location: editingEvent.location || 'SRM University AP',
        type: editingEvent.type || 'Workshop',
        status: (editingEvent.status as any) || 'upcoming',
        date_start: editingEvent.date_start || new Date().toISOString(),
        date_end: editingEvent.date_end || new Date().toISOString(),
        image_url:
          editingEvent.image_url ||
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        registration_open: editingEvent.registration_open ?? true,
        show_opening_soon: false,
        is_published: true,
        max_capacity: editingEvent.max_capacity || 100,
        form_requirements: {
          event_pricing: editingEvent.form_requirements?.event_pricing || 'free',
          registration_fee: editingEvent.form_requirements?.registration_fee || 0,
          allow_teams: editingEvent.form_requirements?.allow_teams ?? false,
          max_team_size: editingEvent.form_requirements?.max_team_size || 4,
          provide_certificates: true,
        },
        gallery_urls: [],
      };
      setEvents([newEv, ...events]);
    }

    setIsModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)' }}>
            Event Operations &amp; Config
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Configure schedules, capacity restrictions, payment fees, and form requirements.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent({
              title: '',
              description: '',
              location: 'Central Block, SRM University AP',
              type: 'Workshop',
              status: 'upcoming',
              max_capacity: 150,
              registration_open: true,
              form_requirements: { event_pricing: 'free', registration_fee: 0, allow_teams: false, max_team_size: 4 },
            });
            setIsModalOpen(true);
          }}
          className="fluent-btn fluent-btn-primary"
        >
          <Plus size={16} /> Create New Event
        </button>
      </div>

      {/* Events Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-rest)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', color: 'var(--text-strong)' }}>
              <th style={{ padding: '12px 16px' }}>Event Name</th>
              <th style={{ padding: '12px 16px' }}>Type &amp; Status</th>
              <th style={{ padding: '12px 16px' }}>Capacity</th>
              <th style={{ padding: '12px 16px' }}>Fee (INR)</th>
              <th style={{ padding: '12px 16px' }}>Registration</th>
              <th style={{ padding: '12px 16px' }}>Publish</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <strong style={{ color: 'var(--text-strong)', display: 'block' }}>{ev.title}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>slug: /{ev.slug}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="fluent-badge badge-info">{ev.type}</span>
                    <span className={`fluent-badge ${ev.status === 'upcoming' ? 'badge-success' : 'badge-warning'}`}>
                      {ev.status}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>{ev.max_capacity} Seats</td>
                <td style={{ padding: '14px 16px' }}>
                  {ev.form_requirements.event_pricing === 'paid' ? `₹${ev.form_requirements.registration_fee}` : 'Free'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => handleToggleRegistration(ev.id)}
                    style={{
                      background: ev.registration_open ? 'var(--success-bg)' : 'var(--bg-soft)',
                      color: ev.registration_open ? 'var(--success)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {ev.registration_open ? 'Open' : 'Closed'}
                  </button>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => handleTogglePublish(ev.id)}
                    style={{
                      background: ev.is_published ? 'var(--brand-soft)' : 'var(--bg-soft)',
                      color: ev.is_published ? 'var(--brand)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {ev.is_published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                      href={`/admin/events/${ev.id}`}
                      className="fluent-btn fluent-btn-primary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => {
                        setEditingEvent(ev);
                        setIsModalOpen(true);
                      }}
                      className="fluent-btn fluent-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <Link
                      href={`/events/${ev.slug}`}
                      target="_blank"
                      className="fluent-btn fluent-btn-subtle"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
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
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lift)',
              padding: '32px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)' }}>
                {editingEvent.id ? 'Edit Event Details' : 'Create New Event'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="fluent-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="fluent-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Event Type
                  </label>
                  <select
                    value={editingEvent.type || 'Workshop'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                    className="fluent-input"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={editingEvent.status || 'upcoming'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="fluent-input"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="fluent-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Max Capacity Limit
                  </label>
                  <input
                    type="number"
                    required
                    value={editingEvent.max_capacity || 100}
                    onChange={(e) => setEditingEvent({ ...editingEvent, max_capacity: parseInt(e.target.value, 10) })}
                    className="fluent-input"
                  />
                </div>
              </div>

              {/* Pricing section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Pricing &amp; Teams</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Pricing Tier
                    </label>
                    <select
                      value={editingEvent.form_requirements?.event_pricing || 'free'}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          form_requirements: {
                            ...editingEvent.form_requirements,
                            event_pricing: e.target.value as 'free' | 'paid',
                          },
                        })
                      }
                      className="fluent-input"
                    >
                      <option value="free">Free Event</option>
                      <option value="paid">Paid (Razorpay Checkout)</option>
                    </select>
                  </div>

                  {editingEvent.form_requirements?.event_pricing === 'paid' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Registration Fee (₹ INR)
                      </label>
                      <input
                        type="number"
                        required
                        value={editingEvent.form_requirements?.registration_fee || 0}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            form_requirements: {
                              ...editingEvent.form_requirements,
                              event_pricing: 'paid',
                              registration_fee: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="fluent-input"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="fluent-btn fluent-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="fluent-btn fluent-btn-primary">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
