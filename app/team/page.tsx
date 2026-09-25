import React from 'react';
import { FALLBACK_TEAM, TeamMemberItem } from '@/lib/data/mock-fallback';
import { Linkedin, Github, Twitter, Instagram, Globe, Mail } from 'lucide-react';

export const metadata = {
  title: 'Team Roster | Microsoft Student Community | SRM University-AP',
  description:
    'Meet the student leaders, engineers, and coordinators driving Microsoft Student Community at SRM University AP.',
};

export default async function TeamPage() {
  const chiefBoard = FALLBACK_TEAM.filter((m) => m.tier === 'chief');
  const boardMembers = FALLBACK_TEAM.filter((m) => m.tier === 'board');
  const teamMembers = FALLBACK_TEAM.filter((m) => m.tier === 'member');

  const renderMemberCard = (member: TeamMemberItem) => (
    <div
      key={member.id}
      className="fluent-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ height: '220px', position: 'relative', overflow: 'hidden', background: 'var(--bg-soft)' }}>
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '48px',
              fontWeight: 600,
            }}
          >
            {member.name.charAt(0)}
          </div>
        )}
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '4px' }}>
          {member.name}
        </h4>
        <span style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: 500, marginBottom: member.email ? '6px' : '16px' }}>
          {member.role}
        </span>
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
            }}
          >
            <Mail size={13} color="var(--brand)" />
            <span>{member.email}</span>
          </a>
        )}

        {/* Social Icons row */}
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          {member.linkedin_url && (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} LinkedIn`}
              style={{ color: 'var(--text-muted)' }}
            >
              <Linkedin size={16} />
            </a>
          )}
          {member.github_url && (
            <a
              href={member.github_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} GitHub`}
              style={{ color: 'var(--text-muted)' }}
            >
              <Github size={16} />
            </a>
          )}
          {member.twitter_url && (
            <a
              href={member.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Twitter`}
              style={{ color: 'var(--text-muted)' }}
            >
              <Twitter size={16} />
            </a>
          )}
          {member.instagram_url && (
            <a
              href={member.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Instagram`}
              style={{ color: 'var(--text-muted)' }}
            >
              <Instagram size={16} />
            </a>
          )}
          {member.portfolio_url && (
            <a
              href={member.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Portfolio`}
              style={{ color: 'var(--text-muted)' }}
            >
              <Globe size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Guild Leadership &bull; Chapter &apos;26
          </span>
          <h1 style={{ fontSize: '44px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
            Community Team Roster
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '720px', marginTop: '8px' }}>
            The engineers, architects, designers, and organizers executing hackathons, workshops, and cloud initiatives at SRM University AP.
          </p>
        </div>

        {/* Tier 1: Chief Board */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ borderBottom: '2px solid var(--brand)', paddingBottom: '8px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)' }}>
              Chief Board
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Executive leadership and strategic direction for Chapter &apos;26
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {chiefBoard.map(renderMemberCard)}
          </div>
        </section>

        {/* Tier 2: Board Members */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ borderBottom: '1px solid var(--border-strong)', paddingBottom: '8px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)' }}>
              Board Members &amp; Domain Leads
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Technical architecture, brand design, and community infrastructure leads
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {boardMembers.map(renderMemberCard)}
          </div>
        </section>

        {/* Tier 3: Core Team Members */}
        <section>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)' }}>
              Core Team Members
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Full-stack developers, events coordinators, and community ambassadors
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {teamMembers.map(renderMemberCard)}
          </div>
        </section>
      </div>
    </div>
  );
}
