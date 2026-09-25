'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, ArrowRight, Ticket, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem('msc_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Check user auth state
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        supabase
          .from('member_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setUserRole(data.role);
          });
      }
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('msc_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Team', href: '/team' },
  ];

  const isStaff = userRole === 'admin' || userRole === 'core_member';

  return (
    <header style={{
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Top chapter banner */}
      <div style={{
        background: 'var(--bg-soft)',
        borderBottom: '1px solid var(--border)',
        padding: '4px 24px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>SRM UNIVERSITY AP &bull; CHAPTER &apos;26</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="https://discord.gg/microsoft"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--brand)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Join Discord Guild <ArrowRight size={12} />
          </a>
          <Link href="/ticket" style={{ color: 'var(--text-body)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Ticket size={12} /> Find Ticket
          </Link>
        </div>
      </div>

      <div className="container" style={{ display: 'flex', height: '64px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand & Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'var(--brand)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '2px',
            padding: '4px',
            borderRadius: '2px'
          }}>
            <div style={{ background: '#f25022' }} />
            <div style={{ background: '#7fba00' }} />
            <div style={{ background: '#00a4ef' }} />
            <div style={{ background: '#ffb900' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Microsoft Student Community
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              SRM University AP
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '8px' }} className="desktop-nav">
          <style>{`
            @media (min-width: 768px) {
              .desktop-nav { display: flex !important; }
              .mobile-toggle { display: none !important; }
            }
          `}</style>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 14px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--brand)' : 'var(--text-body)',
                  borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Admin / Login links */}
          {isStaff ? (
            <Link
              href="/admin"
              className="fluent-btn fluent-btn-secondary"
              style={{ fontSize: '13px', padding: '6px 14px', gap: '6px' }}
            >
              <Shield size={14} /> Admin Portal
            </Link>
          ) : isLoggedIn ? (
            <Link
              href="/onboarding"
              className="fluent-btn fluent-btn-secondary"
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="fluent-btn fluent-btn-primary"
              style={{ fontSize: '13px', padding: '6px 16px' }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            aria-label="Toggle mobile menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-strong)',
              padding: '6px'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '8px 0',
                fontSize: '15px',
                color: pathname === link.href ? 'var(--brand)' : 'var(--text-body)',
                fontWeight: pathname === link.href ? 600 : 400,
                textDecoration: 'none'
              }}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/ticket"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '8px 0', fontSize: '15px', color: 'var(--brand)', textDecoration: 'none' }}
          >
            Find My Ticket &rarr;
          </Link>
          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--accent-strong)', textDecoration: 'none' }}
            >
              Admin Dashboard &rarr;
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
