import React from 'react';
import Link from 'next/link';
import { Mail, Linkedin, Instagram, MessageSquare, Disc as DiscordIcon, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/microsoft-student-community-srm-university/',
      icon: Linkedin,
      label: 'LinkedIn Company',
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/K5NC5wAhg',
      icon: MessageSquare,
      label: 'Discord Guild',
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/msc.srmap/?igsh=YmEwdnlteHUwNjVs#/',
      icon: Instagram,
      label: 'Instagram Profile',
    },
    {
      name: 'Reddit',
      href: 'https://www.reddit.com/user/MSC_SRMAP/',
      icon: Globe,
      label: 'Reddit Profile',
    },
    {
      name: 'Email',
      href: 'mailto:msc.community@srmap.edu.in',
      icon: Mail,
      label: 'Official Inquiries',
    },
  ];

  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-soft)',
        borderTop: '1px solid var(--border)',
        padding: '52px 0 32px 0',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Column 1: Identity & Connect with us */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img
                src="https://lkbwunzswqbnoygxtilm.supabase.co/storage/v1/object/public/webpage/MSC%20Logo.png"
                alt="Microsoft Student Community Logo"
                style={{
                  width: '36px',
                  height: '36px',
                  objectFit: 'contain',
                }}
              />
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                  Microsoft Student Community
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SRM University AP</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              SRM University AP&apos;s premier engineering collective powered by Microsoft Learn Student Ambassadors.
            </p>

            <div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-strong)',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                Connect with us
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                      className="footer-social-link"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Provenance & Mentors */}
          <div>
            <h5
              style={{
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-strong)',
                marginBottom: '14px',
              }}
            >
              Provenance &amp; Mentors
            </h5>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <li>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Founded By:</span>
                <br />
                Jayanth Ramakrishnan
              </li>
              <li>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Faculty Mentors:</span>
                <br />
                Dr. Murali Krishna Enduri Sir and Dr. CV Tomy Sir
              </li>
              <li>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Campus Location:</span>
                <br />
                SRM University AP, Andhra Pradesh
                <br />
                <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  (Coordinates: 16.46°N 80.50°E)
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div>
            <h5
              style={{
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-strong)',
                marginBottom: '14px',
              }}
            >
              Directory &amp; Navigation
            </h5>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li><Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link></li>
              <li><Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>About Us &amp; Manifesto</Link></li>
              <li><Link href="/events" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Events Catalog</Link></li>
              <li><Link href="/gallery" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Photo Archives &amp; Gallery</Link></li>
              <li><Link href="/team" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Leadership Roster</Link></li>
              <li><Link href="/custom-events/synora" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SYNORA Flagship Microsite</Link></li>
            </ul>
          </div>

          {/* Column 4: Participant Hub */}
          <div>
            <h5
              style={{
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-strong)',
                marginBottom: '14px',
              }}
            >
              Participant Hub
            </h5>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li><Link href="/ticket" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Find Digital Ticket &amp; QR</Link></li>
              <li><Link href="/events/synora" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SYNORA &apos;26 Registration</Link></li>
              <li><Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Core &amp; Admin Sign In</Link></li>
              <li><Link href="/onboarding" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Student Profile Setup</Link></li>
              <li><Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Admin Operations Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with exact copyright string */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
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
            &copy; 2026 Microsoft Student Community — SRM University AP. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>CHAPTER &apos;26</span>
            <span>&bull;</span>
            <span>SRM AP &bull; Andhra Pradesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
