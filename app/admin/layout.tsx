import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  Shield,
  Key,
  ExternalLink,
} from 'lucide-react';

export const metadata = {
  title: 'Admin Portal — Microsoft Student Community SRM AP',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminLinks = [
    { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Event Management', href: '/admin/events', icon: Calendar },
    { name: 'Registrations & Badges', href: '/admin/registrations', icon: Users },
    { name: 'QR Camera Scanner', href: '/admin/events/e1000000-0000-0000-0000-000000000001/scanner', icon: QrCode },
    { name: 'Role Management', href: '/admin/roles', icon: Shield },
    { name: 'Password Resets', href: '/admin/passwords', icon: Key },
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

      <div className="container" style={{ padding: '24px', display: 'flex', gap: '24px', flex: 1 }}>
        {/* Navigation Sidebar */}
        <aside
          style={{
            width: '240px',
            flexShrink: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 12px',
            alignSelf: 'flex-start',
            boxShadow: 'var(--shadow-rest)',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 8px 8px 8px', fontWeight: 600 }}>
            Administration
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
