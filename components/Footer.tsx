import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-soft)',
      borderTop: '1px solid var(--border)',
      padding: '48px 0 32px 0',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
          marginBottom: '40px'
        }}>
          {/* Column 1: Identity & Chapter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '18px',
                height: '18px',
                background: 'var(--brand)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '2px',
                padding: '2px',
                borderRadius: '1px'
              }}>
                <div style={{ background: '#f25022' }} />
                <div style={{ background: '#7fba00' }} />
                <div style={{ background: '#00a4ef' }} />
                <div style={{ background: '#ffb900' }} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                Microsoft Student Community
              </h4>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              The premier student developer guild at SRM University AP. Building production systems, distributed cloud software, and agentic AI.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <strong>Official Inquiries:</strong><br />
              <a href="mailto:msc.community@srmap.edu.in" style={{ color: 'var(--brand)' }}>
                msc.community@srmap.edu.in
              </a>
            </p>
          </div>

          {/* Column 2: Provenance & Faculty */}
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-strong)', marginBottom: '14px' }}>
              Provenance & Advisors
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Founded by:</span><br />
                Jayanth Ramakrishnan
              </li>
              <li>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Faculty Advisors:</span><br />
                Dr. Murali Krishna Enduri &amp; Dr. CV Tomy
              </li>
              <li>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Campus Location:</span><br />
                SRM University AP, Andhra Pradesh &bull; India
              </li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-strong)', marginBottom: '14px' }}>
              Navigation &amp; Portals
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link></li>
              <li><Link href="/about" style={{ color: 'var(--text-muted)' }}>Origin Story &amp; Manifesto</Link></li>
              <li><Link href="/events" style={{ color: 'var(--text-muted)' }}>Events &amp; Hackathons</Link></li>
              <li><Link href="/team" style={{ color: 'var(--text-muted)' }}>Community Roster</Link></li>
              <li><Link href="/gallery" style={{ color: 'var(--text-muted)' }}>Photo Archives</Link></li>
              <li><Link href="/custom-events/synora" style={{ color: 'var(--text-muted)' }}>SYNORA &apos;26 Microsite</Link></li>
            </ul>
          </div>

          {/* Column 4: Participant Services */}
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-strong)', marginBottom: '14px' }}>
              Participant Hub
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/ticket" style={{ color: 'var(--brand)', fontWeight: 500 }}>Find Digital Ticket &amp; QR</Link></li>
              <li><Link href="/events/synora-26" style={{ color: 'var(--text-muted)' }}>Flagship Hackathon Registration</Link></li>
              <li><Link href="/login" style={{ color: 'var(--text-muted)' }}>Member Login</Link></li>
              <li><Link href="/admin" style={{ color: 'var(--text-muted)' }}>Organizer Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Microsoft Student Community &bull; SRM University AP. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>CHAPTER &apos;26</span>
            <span>Fluent 2 Production Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
