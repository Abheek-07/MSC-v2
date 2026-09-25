'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Menu,
  X,
  Radio,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
  userRole?: string;
}

export const ADMIN_LINKS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Registrations', href: '/admin/registrations', icon: FileSpreadsheet },
  { name: 'QR Scanner', href: '/admin/scanner', icon: QrCode },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Roles', href: '/admin/roles', icon: Shield },
  { name: 'Password Reqs', href: '/admin/passwords', icon: Key },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminShell({ children, userEmail, userRole }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active tab into view in horizontal scroller
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerWidth = container.offsetWidth;
      const tabLeft = tab.offsetLeft;
      const tabWidth = tab.offsetWidth;

      container.scrollTo({
        left: tabLeft - containerWidth / 2 + tabWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ background: 'var(--bg-soft)', minHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Top Admin Command Bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: '58px',
          zIndex: 40,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="admin-mobile-toggle"
            aria-label="Toggle admin navigation menu"
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-strong)',
              cursor: 'pointer',
              padding: '6px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {mobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

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
              flexShrink: 0,
            }}
          >
            <Shield size={16} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                MSC Command Center
              </strong>
              <span
                className="admin-header-subtext"
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                SRM AP &bull; Chapter &apos;26
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Radio size={12} color="var(--success)" />
            <span className="admin-status-text">Live Mode</span>
          </div>

          <Link
            href="/"
            target="_blank"
            style={{
              fontSize: '12px',
              color: 'var(--brand)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 500,
            }}
            title="Open public website in new tab"
          >
            <span className="admin-portal-text">Public Portal</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* 2. Responsive Horizontal Scrollable Tabs Bar */}
      <div
        ref={tabsContainerRef}
        className="admin-horizontal-tabs"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '6px 12px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          position: 'sticky',
          top: '106px',
          zIndex: 35,
        }}
      >
        {ADMIN_LINKS.map((tab) => {
          const Icon = tab.icon;
          const active = isLinkActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeTabRef : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                color: active ? '#ffffff' : 'var(--text-body)',
                textDecoration: 'none',
                borderRadius: '6px',
                background: active ? 'var(--brand)' : 'var(--bg-soft)',
                border: active ? '1px solid var(--brand)' : '1px solid var(--border)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                boxShadow: active ? '0 1px 4px rgba(0, 103, 184, 0.3)' : 'none',
              }}
            >
              <Icon size={14} color={active ? '#ffffff' : 'var(--brand)'} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>

      {/* 3. Mobile Navigation Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              width: '82%',
              maxWidth: '320px',
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 999,
              boxShadow: 'var(--shadow-lift)',
              padding: '20px 16px',
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--accent-strong)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-strong)', display: 'block' }}>
                    Command Navigation
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    MSC SRM AP &bull; Chapter &apos;26
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
                aria-label="Close navigation drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Snippet */}
            {userEmail && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-soft)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Authenticated As
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userEmail}
                </div>
                {userRole && (
                  <span
                    className={`fluent-badge ${userRole === 'admin' ? 'badge-primary' : 'badge-info'}`}
                    style={{ marginTop: '4px', display: 'inline-block' }}
                  >
                    Role: {userRole}
                  </span>
                )}
              </div>
            )}

            {/* Links List */}
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
              Portal Destinations
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {ADMIN_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      fontWeight: active ? 600 : 500,
                      color: active ? 'var(--brand)' : 'var(--text-body)',
                      background: active ? 'var(--brand-soft)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={18} color={active ? 'var(--brand)' : 'var(--text-muted)'} />
                      <span>{item.name}</span>
                    </div>
                    {active ? (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)' }} />
                    ) : (
                      <ChevronRight size={14} color="var(--border)" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer Actions */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <Link
                href="/"
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--text-body)',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-soft)',
                }}
              >
                <ExternalLink size={14} />
                <span>Open Public Portal</span>
              </Link>

              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--danger)',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Body Container with Responsive Sidebar */}
      <div className="admin-main-container container">
        {/* Desktop Sidebar (Only visible on screens >= 900px) */}
        <aside
          className="admin-desktop-sidebar"
          style={{
            width: '220px',
            flexShrink: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 10px',
            alignSelf: 'flex-start',
            boxShadow: 'var(--shadow-rest)',
            position: 'sticky',
            top: '154px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 8px 8px 8px',
              fontWeight: 600,
            }}
          >
            Command Tabs
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ADMIN_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);
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
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--brand)' : 'var(--text-body)',
                    background: active ? 'var(--brand-soft)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                  className="admin-nav-item"
                >
                  <Icon size={16} color={active ? 'var(--brand)' : 'var(--text-muted)'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Admin Content Area */}
        <main
          className="admin-main-content"
          style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
          }}
        >
          {children}
        </main>
      </div>

      {/* Embedded CSS rules for clean responsive layouts */}
      <style>{`
        .admin-horizontal-tabs::-webkit-scrollbar {
          display: none;
        }

        .admin-main-container {
          padding: 24px;
          display: flex;
          gap: 24px;
          flex: 1;
          width: 100%;
        }

        @media (max-width: 899px) {
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-mobile-toggle {
            display: flex !important;
          }
          .admin-main-container {
            padding: 16px 12px !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .admin-header-subtext {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .admin-portal-text {
            display: none !important;
          }
          .admin-status-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
