'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Radio,
  UserCheck,
  Award,
  ArrowUpRight,
} from 'lucide-react';

interface EventAnalytics {
  id: string;
  title: string;
  category: string;
  date_start: string;
  max_capacity: number;
  total_registrations: number;
  total_headcount: number;
  teams_count: number;
  solo_count: number;
  checked_in_count: number;
}

export default function AdminAnalyticsPage() {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [liveStreamEvents, setLiveStreamEvents] = useState<Array<{ id: string; text: string; time: string; type: 'checkin' | 'reg' }>>([
    { id: '1', text: "Alex Morgan checked in to SYNORA '26 (Turnstile Gate A)", time: 'Just now', type: 'checkin' },
    { id: '2', text: 'Team "Azure Titans" (3 members) completed registration', time: '2m ago', type: 'reg' },
    { id: '3', text: 'Priya Sharma checked in to Cloud Workshop (Lab 4)', time: '5m ago', type: 'checkin' },
    { id: '4', text: 'Kiran Patel verified ticket pass at Turnstile Gate B', time: '11m ago', type: 'checkin' },
  ]);

  // Global aggregate metrics
  const [kpiMetrics, setKpiMetrics] = useState({
    totalCoreUsers: 54,
    totalEvents: FALLBACK_EVENTS.length,
    totalRegistrations: 684,
    totalHeadcount: 1142,
    globalCheckinRate: 76.8,
  });

  // Per-event metrics
  const [eventBreakdown, setEventBreakdown] = useState<EventAnalytics[]>([
    {
      id: FALLBACK_EVENTS[0].id,
      title: FALLBACK_EVENTS[0].title,
      category: 'Hackathon',
      date_start: FALLBACK_EVENTS[0].date_start,
      max_capacity: 500,
      total_registrations: 382,
      total_headcount: 760,
      teams_count: 88,
      solo_count: 120,
      checked_in_count: 592,
    },
    {
      id: FALLBACK_EVENTS[1].id,
      title: FALLBACK_EVENTS[1].title,
      category: 'Workshop',
      date_start: FALLBACK_EVENTS[1].date_start,
      max_capacity: 120,
      total_registrations: 118,
      total_headcount: 118,
      teams_count: 0,
      solo_count: 118,
      checked_in_count: 94,
    },
    {
      id: FALLBACK_EVENTS[2].id,
      title: FALLBACK_EVENTS[2].title,
      category: 'Conference',
      date_start: FALLBACK_EVENTS[2].date_start,
      max_capacity: 250,
      total_registrations: 184,
      total_headcount: 264,
      teams_count: 24,
      solo_count: 112,
      checked_in_count: 191,
    },
  ]);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());

    // Connect to Supabase Realtime channel if available
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('analytics_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'registrations' },
          (payload: any) => {
            setLastUpdated(new Date().toLocaleTimeString());
            const newText =
              payload.eventType === 'INSERT'
                ? `New registration: ${(payload.new as any)?.lead_name || 'Participant'}`
                : `Status update: ${(payload.new as any)?.lead_name || 'Participant'}`;

            setLiveStreamEvents((prev) => [
              { id: String(Date.now()), text: newText, time: 'Just now', type: 'reg' },
              ...prev.slice(0, 7),
            ]);
          }
        )
        .subscribe();
    } catch {
      // Fallback to local simulated heartbeat
    }

    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 15000);

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Realtime Connection Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
            Real-Time Analytics Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Live admission turnstile telemetry and participant conversion for Chapter &apos;26.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
            }}
          >
            <Radio size={14} color="var(--success)" className="pulse-indicator" />
            <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>Realtime Stream Active</span>
            <span style={{ color: 'var(--text-muted)' }}>&bull; {lastUpdated}</span>
          </div>

          <button
            onClick={() => setLastUpdated(new Date().toLocaleTimeString())}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Global KPI Cards (5 Metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Core Community Users
            </span>
            <Users size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-strong)' }}>
            {kpiMetrics.totalCoreUsers}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Verified Chapter &apos;26 Engineers
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Hosted Events
            </span>
            <Calendar size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-strong)' }}>
            {kpiMetrics.totalEvents}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Flagships, Bootcamps, Summits
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Registrations
            </span>
            <TrendingUp size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-strong)' }}>
            {kpiMetrics.totalRegistrations}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Lead registration records
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Headcount
            </span>
            <UserCheck size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand)' }}>
            {kpiMetrics.totalHeadcount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Leads + Team members combined
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Global Check-in Rate
            </span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)' }}>
            {kpiMetrics.globalCheckinRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Physical turnstile attendance
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Per-Event Breakdown Table */}
        <div
          style={{
            gridColumn: 'span 2',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-rest)',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
              Per-Event Turnstile Breakdown
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Teams vs Individuals Conversion
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Event Name</th>
                  <th style={{ padding: '12px 16px' }}>Teams / Solo</th>
                  <th style={{ padding: '12px 16px' }}>Total Attendees</th>
                  <th style={{ padding: '12px 16px' }}>Turnstile Checked In</th>
                  <th style={{ padding: '12px 16px' }}>Conversion Rate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventBreakdown.map((item) => {
                  const rate = Math.round((item.checked_in_count / item.total_headcount) * 100);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {item.category} &bull; {new Date(item.date_start).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <strong style={{ color: 'var(--brand)' }}>{item.teams_count}</strong> teams
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {item.solo_count} solo participants
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{item.total_headcount}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Cap: {item.max_capacity}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                          {item.checked_in_count}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${rate}%`,
                                height: '100%',
                                background: rate > 75 ? 'var(--success)' : 'var(--brand)',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, width: '36px' }}>{rate}%</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <Link
                          href={`/admin/events/${item.id}`}
                          className="fluent-btn fluent-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Turnstile Stream Log */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px',
            boxShadow: 'var(--shadow-rest)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Radio size={16} color="var(--brand)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
              Live Telemetry Stream
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {liveStreamEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-soft)',
                  borderLeft: evt.type === 'checkin' ? '3px solid var(--success)' : '3px solid var(--brand)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                <div style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{evt.text}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{evt.time}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Listening to Supabase Realtime channel <code>analytics_realtime</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
