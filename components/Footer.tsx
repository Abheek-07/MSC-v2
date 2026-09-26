'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Linkedin, Instagram, MessageSquare, Globe } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/microsoft-student-community-srm-university/',
      icon: Linkedin,
      label: 'LinkedIn',
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/K5NC5wAhg',
      icon: MessageSquare,
      label: 'Discord Community',
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/msc.srmap/?igsh=YmEwdnlteHUwNjVs#/',
      icon: Instagram,
      label: 'Instagram',
    },
    {
      name: 'Reddit',
      href: 'https://www.reddit.com/user/MSC_SRMAP/',
      icon: Globe,
      label: 'Reddit',
    },
    {
      name: 'Email',
      href: 'mailto:msc.community@srmap.edu.in',
      icon: Mail,
      label: 'Email Us',
    },
  ];

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Events', href: '/events' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Team', href: '/team' },
    { label: 'Tickets', href: '/ticket' },
    
  ];

  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-soft)',
        borderTop: '1px solid var(--border)',
        padding: '48px 0 28px 0',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '36px',
            marginBottom: '36px',
          }}
        >
          {/* Identity & Mission */}
          <div style={{ maxWidth: '380px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src="https://lkbwunzswqbnoygxtilm.supabase.co/storage/v1/object/public/webpage/MSC%20Logo.png"
                alt="Microsoft Student Community"
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                }}
              />
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                  Microsoft Student Community
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SRM University-AP</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px 0' }}>
              Empowering student innovators, cloud architects, and builders at SRM University-AP. Powered by Microsoft Learn Student Ambassadors.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    style={{
                      width: '34px',
                      height: '34px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-body)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-strong)',
                display: 'block',
                marginBottom: '14px',
              }}
            >
              Quick Links
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(100px, 1fr))',
                gap: '10px 24px',
              }}
            >
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--brand)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact & Location */}
          <div style={{ maxWidth: '280px', width: '100%' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-strong)',
                display: 'block',
                marginBottom: '14px',
              }}
            >
              Contact
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 8px 0' }}>
              SRM University-AP, Neerukonda, Mangalagiri Mandal, Andhra Pradesh 522240
            </p>
            <a
              href="mailto:msc.community@srmap.edu.in"
              style={{
                fontSize: '13px',
                color: 'var(--brand)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              msc.community@srmap.edu.in
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            &copy; 2026 Microsoft Student Community - SRM University-AP. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>SRM University-AP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
