import React from 'react';
import Link from 'next/link';
import { FALLBACK_TEAM, TeamMemberItem } from '@/lib/data/mock-fallback';
import { Linkedin, Github, Twitter, Instagram, Globe, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Leadership & Team Roster | Microsoft Student Community | SRM University-AP',
  description:
    'Meet the student leaders, engineers, and coordinators driving Microsoft Student Community at SRM University AP.',
};

export default async function TeamPage() {
  const chiefBoard = FALLBACK_TEAM.filter((m) => m.tier === 'chief');
  const boardMembers = FALLBACK_TEAM.filter((m) => m.tier === 'board');
  const teamMembers = FALLBACK_TEAM.filter((m) => m.tier === 'member');

  const renderMemberCard = (member: TeamMemberItem, tierColor: string) => (
    <div
      key={member.id}
      className="fluent-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-rest)',
        background: 'var(--surface)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Portrait / Avatar Container */}
      <div
        style={{
          height: '240px',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-soft)',
        }}
      >
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              fontSize: '48px',
              fontWeight: 600,
            }}
          >
            {member.name.charAt(0)}
          </div>
        )}

        {/* Category Pill on top right */}
        {member.category && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.70)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {member.category}
          </span>
        )}
      </div>

      {/* Profile Details */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'var(--text-strong)',
            marginBottom: '4px',
            letterSpacing: '-0.01em',
          }}
        >
          {member.name}
        </h4>

        {/* Role Tag */}
        <div style={{ marginBottom: member.email ? '10px' : '16px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--brand)',
              background: 'var(--brand-soft)',
              padding: '2px 8px',
              borderRadius: '3px',
              display: 'inline-block',
            }}
          >
            {member.role}
          </span>
        </div>

        {/* Official Email */}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            style={{
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              wordBreak: 'break-all',
            }}
          >
            <Mail size={13} color="var(--brand)" />
            <span>{member.email}</span>
          </a>
        )}

        {/* Social Icons row (Microsoft Fluent icon buttons) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: 'auto',
            borderTop: '1px solid var(--border)',
            paddingTop: '14px',
          }}
        >
          {member.linkedin_url && (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} LinkedIn`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
              title="LinkedIn Profile"
            >
              <Linkedin size={14} />
            </a>
          )}
          {member.github_url && (
            <a
              href={member.github_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} GitHub`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
              title="GitHub Profile"
            >
              <Github size={14} />
            </a>
          )}
          {member.twitter_url && (
            <a
              href={member.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Twitter / X`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
              title="Twitter Profile"
            >
              <Twitter size={14} />
            </a>
          )}
          {member.instagram_url && (
            <a
              href={member.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Instagram`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
              title="Instagram Profile"
            >
              <Instagram size={14} />
            </a>
          )}
          {member.portfolio_url && (
            <a
              href={member.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Portfolio`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
              title="Personal Website"
            >
              <Globe size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header with Microsoft 4-Color Eyebrow */}
        <div style={{ marginBottom: '48px', maxWidth: '840px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--text-body)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 6px)',
                gridTemplateRows: 'repeat(2, 6px)',
                gap: '2px',
                flexShrink: 0,
              }}
            >
              <div style={{ background: '#f25022', borderRadius: '1px' }} />
              <div style={{ background: '#7fba00', borderRadius: '1px' }} />
              <div style={{ background: '#00a4ef', borderRadius: '1px' }} />
              <div style={{ background: '#ffb900', borderRadius: '1px' }} />
            </div>
            <span>MICROSOFT STUDENT COMMUNITY &bull; LEADERSHIP &amp; ENGINEERING ROSTER</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 44px)',
              fontWeight: 600,
              color: 'var(--text-strong)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Chapter Leadership &amp; Engineering Roster
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            Meet the student executives, domain architects, and engineers powering hackathons, open-source initiatives, and technical workshops at SRM University-AP.
          </p>
        </div>

        {/* Tier 1: Chief Board (Executive Leadership) */}
        <section style={{ marginBottom: '64px' }}>
          <div
            style={{
              borderLeft: '3px solid var(--brand)',
              paddingLeft: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  Executive Leadership (Chief Board)
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {chiefBoard.length} Members
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Strategic governance, university relations, and chapter direction for Chapter &apos;26
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: '24px',
            }}
          >
            {chiefBoard.map((m) => renderMemberCard(m, 'var(--brand)'))}
          </div>
        </section>

        {/* Tier 2: Board Members & Domain Leads */}
        <section style={{ marginBottom: '64px' }}>
          <div
            style={{
              borderLeft: '3px solid #107c10',
              paddingLeft: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  Domain Leads &amp; Technical Directors
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {boardMembers.length} Members
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Cloud engineering, technical architecture, brand communications, and operational logistics
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: '24px',
            }}
          >
            {boardMembers.map((m) => renderMemberCard(m, '#107c10'))}
          </div>
        </section>

        {/* Tier 3: Core Team Members & Ambassadors */}
        <section style={{ marginBottom: '72px' }}>
          <div
            style={{
              borderLeft: '3px solid #d83b01',
              paddingLeft: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  Engineering Members &amp; Coordinators
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--warning-bg)',
                    color: 'var(--warning)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {teamMembers.length} Members
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Full-stack developers, sprint moderators, and campus community ambassadors
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: '24px',
            }}
          >
            {teamMembers.map((m) => renderMemberCard(m, '#d83b01'))}
          </div>
        </section>

        {/* Join Chapter Leadership Ribbon */}
        <section>
          <div
            style={{
              padding: 'clamp(28px, 4vw, 36px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-rest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '4px' }}>
                Interested in Joining the Engineering Chapter?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '600px' }}>
                Applications for student leads, core developers, and event coordinators open each semester. Build real enterprise applications with Microsoft technologies.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/events"
                className="fluent-btn fluent-btn-primary"
                style={{
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: 'var(--brand)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Attend Next Event <ArrowRight size={14} />
              </Link>
              <Link
                href="/about"
                className="fluent-btn fluent-btn-secondary"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Read Community Charter
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
