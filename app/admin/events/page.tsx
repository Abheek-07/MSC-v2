'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Calendar, MapPin, Users, Check, X, ShieldAlert, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { EventItem } from '@/lib/data/mock-fallback';
import { createClient } from '@/lib/supabase/client';

export default function AdminEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events as EventItem[]);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTogglePublish = async (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const nextVal = !target.is_published;
    setEvents(events.map((e) => (e.id === id ? { ...e, is_published: nextVal } : e)));
    try {
      await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_published: nextVal }),
      });
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleToggleRegistration = async (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const nextVal = !target.registration_open;
    setEvents(events.map((e) => (e.id === id ? { ...e, registration_open: nextVal } : e)));
    try {
      await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, registration_open: nextVal }),
      });
    } catch (err) {
      console.error('Failed to toggle registration:', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove associated registrations.')) return;
    setEvents(events.filter((e) => e.id !== id));
    try {
      await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() + 7);
    defaultStart.setHours(10, 0, 0, 0);

    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(17, 0, 0, 0);

    setEditingEvent({
      title: '',
      slug: '',
      description: '',
      location: 'Central Block Auditorium, SRM University AP',
      type: 'Workshop',
      status: 'upcoming',
      date_start: defaultStart.toISOString().slice(0, 16),
      date_end: defaultEnd.toISOString().slice(0, 16),
      image_url: 'https://lkbwunzswqbnoygxtilm.supabase.co/storage/v1/object/public/webpage/hackmsc1.jpg',
      max_capacity: 150,
      registration_open: true,
      is_published: true,
      form_requirements: {
        event_pricing: 'free',
        registration_fee: 0,
        allow_teams: false,
        max_team_size: 4,
        provide_certificates: true,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev: EventItem) => {
    let startLocal = '';
    let endLocal = '';

    try {
      if (ev.date_start) {
        const d = new Date(ev.date_start);
        if (!isNaN(d.getTime())) startLocal = d.toISOString().slice(0, 16);
      }
      if (ev.date_end) {
        const d = new Date(ev.date_end);
        if (!isNaN(d.getTime())) endLocal = d.toISOString().slice(0, 16);
      }
    } catch (e) {
      console.warn('Date parsing error:', e);
    }

    setEditingEvent({
      ...ev,
      date_start: startLocal,
      date_end: endLocal,
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSaving(true);

    try {
      const payload = {
        ...editingEvent,
        slug:
          editingEvent.slug?.trim() ||
          (editingEvent.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        date_start: editingEvent.date_start
          ? new Date(editingEvent.date_start).toISOString()
          : new Date().toISOString(),
        date_end: editingEvent.date_end
          ? new Date(editingEvent.date_end).toISOString()
          : new Date().toISOString(),
      };

      if (editingEvent.id) {
        // Update existing
        await fetch('/api/admin/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await fetchEvents();
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Failed to save event. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 5px)',
                gridTemplateRows: 'repeat(2, 5px)',
                gap: '2px',
              }}
            >
              <div style={{ background: '#f25022' }} />
              <div style={{ background: '#7fba00' }} />
              <div style={{ background: '#00a4ef' }} />
              <div style={{ background: '#ffb900' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Operations Console &bull; Events Engine
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)' }}>
            Event Operations &amp; Configuration
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Configure schedules, ticket capacities, Razorpay pricing, and participant registration rules. Changes instantly reflect across all public pages.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="fluent-btn fluent-btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--brand)',
            color: '#ffffff',
          }}
        >
          <Plus size={16} /> Create New Event
        </button>
      </div>

      {/* Events Table Container */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          boxShadow: 'var(--shadow-rest)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', color: 'var(--text-strong)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Event Title &amp; Slug</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type &amp; Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Schedule</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Capacity</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pricing</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Registration</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Visibility</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading events directory from database...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No events found in the database. Click &ldquo;Create New Event&rdquo; to launch your first sprint.
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const startDate = new Date(ev.date_start);
                const isPaid = ev.form_requirements?.event_pricing === 'paid';
                const dateLabel = !isNaN(startDate.getTime())
                  ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A';

                return (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Title & Slug */}
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: '13.5px' }}>
                        {ev.title}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--brand)', fontFamily: 'monospace' }}>
                        /events/{ev.slug}
                      </span>
                    </td>

                    {/* Type & Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="fluent-badge badge-info" style={{ borderRadius: '3px', fontSize: '11px' }}>
                          {ev.type}
                        </span>
                        <span
                          className={`fluent-badge ${ev.status === 'upcoming' ? 'badge-success' : 'badge-neutral'}`}
                          style={{ borderRadius: '3px', fontSize: '11px' }}
                        >
                          {ev.status}
                        </span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
                      {dateLabel}
                    </td>

                    {/* Capacity */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>
                      {ev.max_capacity} seats
                    </td>

                    {/* Pricing */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: isPaid ? 'var(--warning)' : 'var(--success)',
                        }}
                      >
                        {isPaid ? `₹${ev.form_requirements?.registration_fee}` : 'Free'}
                      </span>
                    </td>

                    {/* Registration Toggle */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleRegistration(ev.id)}
                        style={{
                          background: ev.registration_open ? 'var(--success-bg)' : 'var(--bg-soft)',
                          color: ev.registration_open ? 'var(--success)' : 'var(--text-muted)',
                          border: `1px solid ${ev.registration_open ? 'rgba(14,124,65,0.2)' : 'var(--border)'}`,
                          borderRadius: '3px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {ev.registration_open ? 'Open' : 'Closed'}
                      </button>
                    </td>

                    {/* Published Toggle */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleTogglePublish(ev.id)}
                        style={{
                          background: ev.is_published ? 'var(--brand-soft)' : 'var(--bg-soft)',
                          color: ev.is_published ? 'var(--brand)' : 'var(--text-muted)',
                          border: `1px solid ${ev.is_published ? 'rgba(0,103,184,0.2)' : 'var(--border)'}`,
                          borderRadius: '3px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {ev.is_published ? 'Live' : 'Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Link
                          href={`/admin/events/${ev.id}`}
                          className="fluent-btn fluent-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '3px' }}
                        >
                          Manage
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="fluent-btn fluent-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '3px', gap: '4px' }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <Link
                          href={`/events/${ev.slug}`}
                          target="_blank"
                          className="fluent-btn fluent-btn-subtle"
                          style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '3px' }}
                          title="View Live Portal"
                        >
                          <ExternalLink size={13} />
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="fluent-btn fluent-btn-subtle"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', borderRadius: '3px' }}
                          title="Delete Event"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL - MICROSOFT FLUENT 2 STRUCTURE */}
      {isModalOpen && editingEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 12, 16, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 24px)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              maxWidth: '720px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'var(--surface)',
              borderRadius: '6px',
              boxShadow: 'var(--shadow-lift)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {editingEvent.id ? 'Event Configuration Update' : 'New Event Provisioning'}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '2px' }}>
                  {editingEvent.id ? `Edit: ${editingEvent.title}` : 'Create Campus Event'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEvent} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* SECTION 1: IDENTITY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.title || ''}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      const updates: Partial<EventItem> = { ...editingEvent, title: newTitle };
                      // If new event, auto-slugify
                      if (!editingEvent.id) {
                        updates.slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      }
                      setEditingEvent(updates);
                    }}
                    placeholder="e.g. Azure & AI Developer Summit"
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.slug || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, slug: e.target.value })}
                    placeholder="e.g. azure-ai-summit-26"
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Event Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Detail the sprint timeline, target audience, technical prerequisites, and outcomes..."
                  className="fluent-input"
                  style={{ width: '100%', borderRadius: '4px', padding: '10px 12px', fontSize: '13px' }}
                />
              </div>

              {/* SECTION 2: CLASSIFICATION & DATES */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    Event Type
                  </label>
                  <select
                    value={editingEvent.type || 'Workshop'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Conference">Conference</option>
                    <option value="Speaker Session">Speaker Session</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    Lifecycle Status
                  </label>
                  <select
                    value={editingEvent.status || 'upcoming'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed / Archive</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    Max Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingEvent.max_capacity || 100}
                    onChange={(e) => setEditingEvent({ ...editingEvent, max_capacity: parseInt(e.target.value, 10) || 100 })}
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Schedule Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingEvent.date_start || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date_start: e.target.value })}
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    End Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingEvent.date_end || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date_end: e.target.value })}
                    className="fluent-input"
                    style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Venue / Location */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Venue / Location *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  placeholder="e.g. Central Block Auditorium / Online via Teams"
                  className="fluent-input"
                  style={{ width: '100%', height: '38px', borderRadius: '4px' }}
                />
              </div>

              {/* Poster / Image URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Poster Image URL
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="url"
                    value={editingEvent.image_url || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, image_url: e.target.value })}
                    placeholder="https://... or /images/hero-bg.png"
                    className="fluent-input"
                    style={{ flex: 1, height: '38px', borderRadius: '4px' }}
                  />
                  {editingEvent.image_url && (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={editingEvent.image_url}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: PRICING & REGISTRATION */}
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-soft)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  Pricing &amp; Registration Policy
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
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
                      style={{ width: '100%', height: '36px', borderRadius: '4px' }}
                    >
                      <option value="free">Free Admission</option>
                      <option value="paid">Paid (Razorpay Gateway)</option>
                    </select>
                  </div>

                  {editingEvent.form_requirements?.event_pricing === 'paid' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                        Registration Fee (₹ INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={editingEvent.form_requirements?.registration_fee || 0}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            form_requirements: {
                              ...editingEvent.form_requirements,
                              event_pricing: 'paid',
                              registration_fee: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="fluent-input"
                        style={{ width: '100%', height: '36px', borderRadius: '4px' }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                      Registration Status
                    </label>
                    <select
                      value={editingEvent.registration_open ? 'open' : 'closed'}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          registration_open: e.target.value === 'open',
                        })
                      }
                      className="fluent-input"
                      style={{ width: '100%', height: '36px', borderRadius: '4px' }}
                    >
                      <option value="open">Registration Open</option>
                      <option value="closed">Registration Closed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                      Public Visibility
                    </label>
                    <select
                      value={editingEvent.is_published ? 'published' : 'draft'}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          is_published: e.target.value === 'published',
                        })
                      }
                      className="fluent-input"
                      style={{ width: '100%', height: '36px', borderRadius: '4px' }}
                    >
                      <option value="published">Published (Visible on site)</option>
                      <option value="draft">Draft (Admin only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="fluent-btn fluent-btn-secondary"
                  style={{ padding: '8px 18px', borderRadius: '4px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="fluent-btn fluent-btn-primary"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: 'var(--brand)',
                    color: '#ffffff',
                  }}
                >
                  {saving ? 'Saving...' : editingEvent.id ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
