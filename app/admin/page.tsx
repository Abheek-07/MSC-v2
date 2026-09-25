import React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CheckCircle,
  IndianRupee,
  Mail,
  QrCode,
  Shield,
  ArrowRight,
  TrendingUp,
  Plus,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { EMAIL_DAILY_CAP } from '@/lib/email';
import { getAdminClient } from '@/lib/supabase/admin';

export default async function AdminDashboardPage() {
  const supabase = getAdminClient();

  // 1. Live Events query
  const { data: events } = await supabase.from('events').select('id, status');
  const totalEvents = events?.length || 0;
  const activeEvents = events?.filter((e: any) => e.status === 'upcoming').length || 0;

  // 2. Live Registrations query
  const { data: registrations } = await supabase.from('registrations').select('id, checked_in');
  const totalRegistrations = registrations?.length || 0;
  const checkedInCount = registrations?.filter((r: any) => r.checked_in).length || 0;
  const attendanceRate = totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0;

  // 3. Live Payments / Revenue query
  const { data: payments } = await supabase.from('payments').select('amount').eq('status', 'captured');
  const revenueInRupees = payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Microsoft Fluent Page Header & Command Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--text-strong)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Real-time telemetry, admission capacity, and event operations for Chapter &apos;26.
          </p>
        </div>

        {/* Microsoft Command Bar Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href="/admin/events"
            className="fluent-btn fluent-btn-primary"
            style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
          >
            <Plus size={14} /> Create Event
          </Link>
          <Link
            href="/admin/scanner"
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
          >
            <QrCode size={14} /> Turnstile Scanner
          </Link>
          <Link
            href="/admin/registrations"
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
          >
            <FileSpreadsheet size={14} /> Attendees
          </Link>
        </div>
      </div>

      {/* Transactional Email Quota Note */}
      <div
        style={{
          background: 'var(--bg-tinted)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={16} color="var(--brand)" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-strong)' }}>
              Email Service Quota &bull; Resend Free Tier
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-body)', marginLeft: '8px' }}>
              Cap: <strong>{EMAIL_DAILY_CAP} emails/day</strong>. Throttle bulk blasts across multiple batches if approaching threshold.
            </span>
          </div>
        </div>
        <span className="fluent-badge badge-info" style={{ borderRadius: '4px' }}>
          {EMAIL_DAILY_CAP} / day
        </span>
      </div>

      {/* 4 Fluent Metric Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Registrations
            </span>
            <Users size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>
            {totalRegistrations}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={11} /> Across all active sessions
          </span>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Turnstile Attendance
            </span>
            <CheckCircle size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>
            {attendanceRate}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {checkedInCount} of {totalRegistrations} checked in
          </span>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gross Revenue
            </span>
            <IndianRupee size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>
            &#8377;{revenueInRupees.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Captured through Razorpay
          </span>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Events
            </span>
            <Calendar size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>
            {activeEvents}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {totalEvents} total hosted
          </span>
        </div>
      </div>

      {/* Operations Quick Launchpad */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '12px' }}>
          Quick Launchpad
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--brand-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={18} color="var(--brand)" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Door Turnstile Scanner</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
              Full-screen camera QR validator with offline IndexedDB queueing to check in participants and teams.
            </p>
            <Link
              href="/admin/scanner"
              className="fluent-btn fluent-btn-primary"
              style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
            >
              Launch Scanner &rarr;
            </Link>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--brand-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} color="var(--brand)" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Registrations Ledger</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
              Filter attendees, manual walk-in tickets, print event badges, and export to CSV or Excel (.xlsx).
            </p>
            <Link
              href="/admin/registrations"
              className="fluent-btn fluent-btn-secondary"
              style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
            >
              Manage Ledger &rarr;
            </Link>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--brand-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={18} color="var(--brand)" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Live Conversion Telemetry</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
              Real-time admission turnout stream, solo vs. team ratios, and event capacity tracking.
            </p>
            <Link
              href="/admin/analytics"
              className="fluent-btn fluent-btn-secondary"
              style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
            >
              View Analytics &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
