'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FALLBACK_EVENTS, EventItem } from '@/lib/data/mock-fallback';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="fluent-card" style={{ padding: '48px', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Initializing camera scanner module...</p>
    </div>
  ),
});

export default function AdminGlobalScannerPage() {
  const [events, setEvents] = useState<EventItem[]>(FALLBACK_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>(FALLBACK_EVENTS[0].id);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; is_active: boolean }>>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    const client = createClient();
    client
      .from('events')
      .select('*')
      .order('date_start', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setEvents(data as EventItem[]);
          setSelectedEventId(data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setSessionsLoading(true);
    setSelectedSessionId('');
    fetch('/api/admin/sessions?event_id=' + encodeURIComponent(selectedEventId), { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load sessions.');
        const active = (data.sessions || []).filter((session: any) => session.is_active);
        setSessions(active);
        setSelectedSessionId(active[0]?.id || '');
      })
      .catch((error) => { console.error('Failed to load event sessions:', error); setSessions([]); })
      .finally(() => setSessionsLoading(false));
  }, [selectedEventId]);

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0] || FALLBACK_EVENTS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/admin" style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Door Scanner</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
            Live Door QR Scanner &amp; Offline Queue
          </h1>
        </div>

        {/* Event Selector Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="var(--brand)" />
          <label htmlFor="event-select" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)' }}>
            Turnstile Event:
          </label>
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="fluent-input"
            style={{ width: 'auto', minWidth: '220px', padding: '6px 12px', fontSize: '13px' }}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
        <Clock size={16} color="var(--brand)" />
        <label htmlFor="session-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>Attendance session:</label>
        <select id="session-select" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="fluent-input" style={{ minWidth: 240, width: 'auto', padding: '6px 12px', fontSize: 13 }} disabled={sessionsLoading || sessions.length === 0}>
          {sessions.length === 0 && <option value="">No active sessions</option>}
          {sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}
        </select>
        {sessionsLoading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading sessions...</span>}
        {!sessionsLoading && sessions.length === 0 && <Link href="/admin/sessions" style={{ fontSize: 12, color: 'var(--brand)' }}>Create an event session</Link>}
      </div>

      {/* Session attendance scanner. Session selection scopes every scan to that session. */}
      {selectedSessionId ? (
        <QRScanner key={selectedEventId + ':' + selectedSessionId} eventId={selectedEventId} eventTitle={currentEvent.title} sessionId={selectedSessionId} sessionTitle={sessions.find((s) => s.id === selectedSessionId)?.title} />
      ) : (
        <div className="fluent-card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>Create and activate a session before recording session attendance.</div>
      )}
    </div>
  );
}
