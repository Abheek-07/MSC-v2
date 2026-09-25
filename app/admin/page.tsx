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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-strong)' }}>
          Platform Operations Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Real-time metrics, capacity telemetry, and event operations for MSC Chapter &apos;26.
        </p>
      </div>

      {/* Transactional Email Quota Alert (Section 1 requirement) */}
      <div
        style={{
          background: 'var(--bg-tinted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={20} color="var(--brand)" />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--text-strong)' }}>
              Email Delivery Service Quota Note
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0 }}>
              Free Tier Cap: <strong>{EMAIL_DAILY_CAP} emails/day</strong>. Throttle mass notification blasts across multiple batches if approaching threshold.
            </p>
          </div>
        </div>
        <span className="fluent-badge badge-info">{EMAIL_DAILY_CAP} Emails / Day Max</span>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '16px' }}>
        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Total Registrations</span>
            <Users size={18} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-strong)' }}>
            {totalRegistrations}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={12} /> Across all active sessions
          </span>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Turnstile Attendance</span>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-strong)' }}>
            {attendanceRate}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {checkedInCount} / {totalRegistrations} checked in
          </span>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Gross Revenue</span>
            <IndianRupee size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-strong)' }}>
            &#8377; {revenueInRupees.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Captured through Razorpay
          </span>
        </div>

        <div className="fluent-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Live Events</span>
            <Calendar size={18} color="var(--accent-strong)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-strong)' }}>
            {activeEvents}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {totalEvents} total hosted
          </span>
        </div>
      </div>

      {/* Quick Launchpad Tiles */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '16px' }}>
          Operations Launchpad
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
          <div className="fluent-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <QrCode size={20} color="var(--brand)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Real-Time QR Turnstile Scanner</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
              Launch full-screen camera QR scanner to check in participants and individual team members at the entrance.
            </p>
            <Link
              href="/admin/scanner"
              className="fluent-btn fluent-btn-primary"
              style={{ alignSelf: 'flex-start', fontSize: '13px' }}
            >
              Launch QR Scanner &rarr;
            </Link>
          </div>

          <div className="fluent-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Users size={20} color="var(--brand)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Registrations, Badges &amp; Export</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
              Filter attendees, manually register at-the-door walk-ins, print badges, and export to CSV or formatted Excel (.xlsx).
            </p>
            <Link
              href="/admin/registrations"
              className="fluent-btn fluent-btn-secondary"
              style={{ alignSelf: 'flex-start', fontSize: '13px' }}
            >
              Manage Registrations &rarr;
            </Link>
          </div>

          <div className="fluent-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Shield size={20} color="var(--brand)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Security &amp; Password Resets</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
              Review encrypted password reset requests in queue and manage user roles (admin, core_member, user).
            </p>
            <Link
              href="/admin/passwords"
              className="fluent-btn fluent-btn-secondary"
              style={{ alignSelf: 'flex-start', fontSize: '13px' }}
            >
              Review Approvals &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
