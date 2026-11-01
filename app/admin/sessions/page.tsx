'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, QrCode, Users } from 'lucide-react';

type EventOption = { id: string; title: string };
type Attendee = { id: string; name: string; email: string; registration_number: string; team_name: string; checked_in_at: string };
type Session = {
  id: string; event_id: string; title: string; description?: string | null;
  location?: string | null; starts_at?: string | null; ends_at?: string | null;
  is_active: boolean; attendance_count: number;
};

function localDateTime(value?: string | null) {
  if (!value) return 'Time not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time not set' : date.toLocaleString();
}

export default function AdminSessionsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const selectedEvent = useMemo(() => events.find((event) => event.id === eventId), [events, eventId]);

  useEffect(() => {
    fetch('/api/admin/events', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load events.');
        const options = (data.events || []).map((event: any) => ({ id: event.id, title: event.title }));
        setEvents(options);
        if (options.length) setEventId(options[0].id);
      })
      .catch((err) => setError(err.message || 'Unable to load events.'));
  }, []);

  async function loadSessions(id = eventId) {
    if (!id) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    setSelectedSession(null);
    setAttendees([]);
    setError('');
    try {
      const response = await fetch('/api/admin/sessions?event_id=' + encodeURIComponent(id), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load sessions.');
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load sessions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (eventId) loadSessions(eventId); }, [eventId]);

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId, title, description, location,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create session.');
      setTitle(''); setDescription(''); setLocation(''); setStartsAt(''); setEndsAt('');
      await loadSessions(eventId);
    } catch (err: any) {
      setError(err.message || 'Unable to create session.');
    } finally {
      setSaving(false);
    }
  }

  async function viewAttendance(session: Session) {
    setSelectedSession(session);
    setAttendanceLoading(true);
    setAttendees([]);
    try {
      const response = await fetch('/api/admin/session-attendance?session_id=' + encodeURIComponent(session.id), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load attendance.');
      setAttendees(data.attendees || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load attendance.');
    } finally {
      setAttendanceLoading(false);
    }
  }

  function exportAttendance() {
    if (!selectedSession) return;
    const rows = [['Name', 'Email', 'Registration Number', 'Team', 'Checked In At'], ...attendees.map((a) => [a.name, a.email, a.registration_number, a.team_name, a.checked_in_at])];
    const csv = rows.map((row) => row.map((value) => '"' + String(value || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = selectedSession.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-attendance.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  async function toggleSession(session: Session) {
    const response = await fetch('/api/admin/sessions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id, is_active: !session.is_active }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) { setError(data.error || 'Unable to update session.'); return; }
    await loadSessions(eventId);
  }

  async function deleteSession(session: Session) {
    if (!window.confirm('Delete "' + session.title + '" and its attendance records? This cannot be undone.')) return;
    const response = await fetch('/api/admin/sessions?id=' + encodeURIComponent(session.id), { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok || !data.success) { setError(data.error || 'Unable to delete session.'); return; }
    await loadSessions(eventId);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-strong)',
    font: 'inherit', fontSize: '13px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>Operations / Attendance</div>
          <h1 style={{ margin: 0, fontSize: 25, color: 'var(--text-strong)' }}>Session Management</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Create event sessions and track attendance independently for each session.</p>
        </div>
        <Link href="/admin/scanner" className="fluent-btn fluent-btn-secondary" style={{ textDecoration: 'none' }}>
          <QrCode size={15} /> Open QR scanner
        </Link>
      </div>

      <section className="fluent-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }} htmlFor="session-event">Select event</label>
        <select id="session-event" value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ ...inputStyle, maxWidth: 520 }}>
          {events.length === 0 && <option value="">No events available</option>}
          {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
        {selectedEvent && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Managing sessions for {selectedEvent.title}</span>}
      </section>

      {error && <div role="alert" style={{ padding: 12, borderRadius: 6, background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

      <section className="fluent-card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, color: 'var(--text-strong)' }}><Plus size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />Create a session</h2>
        <form onSubmit={createSession} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
          <input required minLength={2} maxLength={120} placeholder="Session title, e.g. Opening Ceremony" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <input placeholder="Venue or room" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
          <input type="datetime-local" aria-label="Session start" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
          <input type="datetime-local" aria-label="Session end" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle} />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving || !eventId} className="fluent-btn fluent-btn-primary">{saving ? 'Creating...' : 'Create session'}</button>
          </div>
        </form>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 17, color: 'var(--text-strong)' }}>Event sessions ({sessions.length})</h2>
          <button onClick={() => loadSessions()} className="fluent-btn fluent-btn-secondary" style={{ fontSize: 12 }}><RefreshCw size={14} /> Refresh</button>
        </div>
        {loading ? <div className="fluent-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>Loading sessions...</div> :
          sessions.length === 0 ? <div className="fluent-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}><CalendarDays size={28} style={{ margin: '0 auto 8px' }} /><p style={{ margin: 0 }}>No sessions yet. Create the first session above.</p></div> :
          sessions.map((session) => (
            <article key={session.id} className="fluent-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 220, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--text-strong)', fontSize: 15 }}>{session.title}</strong>
                  <span className={'fluent-badge ' + (session.is_active ? 'badge-success' : 'badge-warning')}>{session.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>{localDateTime(session.starts_at)}{session.ends_at ? ' – ' + localDateTime(session.ends_at) : ''}{session.location ? ' · ' + session.location : ''}</div>
                {session.description && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '6px 0 0' }}>{session.description}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-strong)' }}><Users size={17} /><div style={{ fontSize: 17, fontWeight: 700 }}>{session.attendance_count}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Present</div></div>
                <button onClick={() => viewAttendance(session)} className="fluent-btn fluent-btn-secondary" style={{ fontSize: 12 }}>View attendance</button>
                <button onClick={() => toggleSession(session)} className="fluent-btn fluent-btn-secondary" style={{ fontSize: 12 }}>{session.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}{session.is_active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => deleteSession(session)} className="fluent-btn fluent-btn-secondary" style={{ fontSize: 12, color: 'var(--danger)' }}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
      </section>

      {selectedSession && (
        <section className="fluent-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><h2 style={{ margin: 0, fontSize: 17, color: 'var(--text-strong)' }}>{selectedSession.title} attendance</h2><p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{attendees.length} attendees checked in</p></div>
            <button onClick={exportAttendance} disabled={attendees.length === 0} className="fluent-btn fluent-btn-secondary" style={{ fontSize: 12 }}>Export CSV</button>
          </div>
          {attendanceLoading ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading attendance...</p> : attendees.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No attendees have checked into this session yet.</p> : (
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}><thead><tr><th style={{ padding: 9 }}>Attendee</th><th style={{ padding: 9 }}>Email</th><th style={{ padding: 9 }}>Registration No.</th><th style={{ padding: 9 }}>Team</th><th style={{ padding: 9 }}>Checked in</th></tr></thead><tbody>{attendees.map((attendee) => <tr key={attendee.id} style={{ borderTop: '1px solid var(--border)' }}><td style={{ padding: 9 }}>{attendee.name}</td><td style={{ padding: 9 }}>{attendee.email}</td><td style={{ padding: 9 }}>{attendee.registration_number}</td><td style={{ padding: 9 }}>{attendee.team_name || 'Individual'}</td><td style={{ padding: 9 }}>{localDateTime(attendee.checked_in_at)}</td></tr>)}</tbody></table></div>
          )}
        </section>
      )}
    </div>
  );
}
