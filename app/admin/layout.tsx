import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  Key,
  Settings,
  BarChart3,
  ExternalLink,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

export const metadata = {
  title: 'Admin Portal | Microsoft Student Community SRM AP',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?redirect=/admin');
  }

  const { data: profile } = await supabase
    .from('member_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'core_member')) {
    redirect('/login?error=unauthorized');
  }
  const adminLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'QR Scanner', href: '/admin/scanner', icon: QrCode },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Password Reqs', href: '/admin/passwords', icon: Key },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Registrations', href: '/admin/registrations', icon: FileSpreadsheet },
  ];

  return (
    <div style={{ background: 'var(--bg-soft)', minHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Sub-bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--accent-strong)',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={16} />
          </div>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-strong)' }}>
              MSC Admin Command Center
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              SRM University AP &bull; Chapter &apos;26
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="fluent-badge badge-success">Live Production Mode</span>
          <Link href="/" target="_blank" style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Public Portal <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Tabs Bar (Direct Architecture Match) */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '8px 24px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
        }}
      >
        {[
          { name: 'Events', href: '/admin/events' },
          { name: 'QR Scanner', href: '/admin/scanner' },
          { name: 'Analytics', href: '/admin/analytics' },
          { name: 'Users', href: '/admin/users' },
          { name: 'Password Reqs', href: '/admin/passwords' },
          { name: 'Settings', href: '/admin/settings' },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-body)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            className="admin-tab-pill"
          >
            [{tab.name}]
          </Link>
        ))}
      </div>

      <div className="container" style={{ padding: '24px', display: 'flex', gap: '24px', flex: 1 }}>
        {/* Navigation Sidebar */}
        <aside
          style={{
            width: '220px',
            flexShrink: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 10px',
            alignSelf: 'flex-start',
            boxShadow: 'var(--shadow-rest)',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 8px 8px 8px', fontWeight: 600 }}>
            Command Tabs
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-body)',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                  className="admin-nav-item"
                >
                  <Icon size={16} color="var(--brand)" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Admin Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
