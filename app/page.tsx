import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ExternalLink,
  Cpu,
  Cloud,
  Terminal,
  Trophy,
  Users,
  Award,
  Calendar,
  MapPin,
  Send,
  Sparkles,
} from 'lucide-react';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';

export default async function HomePage() {
  const upcomingEvents = FALLBACK_EVENTS.filter((e) => e.status === 'upcoming');

  return (
    <div>
      {/* 1. CINEMATIC DARK HERO SECTION (Homepage only, per Microsoft.com design pattern) */}
      <section
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, #162a45 0%, var(--bg-deep) 50%, var(--bg-deeper) 100%)',
          color: 'var(--text-on-dark)',
          padding: '100px 0 90px 0',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '860px' }}>
            {/* Eyebrow stack */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                background: 'rgba(0, 103, 184, 0.25)',
                border: '1px solid rgba(0, 103, 184, 0.5)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '28px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#58a6ff',
              }}
            >
              <span>MICROSOFT STUDENT COMMUNITY</span>
              <span>&bull;</span>
              <span>SRM UNIVERSITY AP</span>
              <span>&bull;</span>
              <span>CHAPTER &apos;26</span>
            </div>

            {/* Headline */}
            <h1
              className="display-hero"
              style={{
                color: '#ffffff',
                marginBottom: '24px',
                fontWeight: 600,
              }}
            >
              Where Student Builders Engineer Production Scale.
            </h1>

            {/* Sub-headline */}
            <p
              className="body-lg"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                maxWidth: '680px',
                lineHeight: 1.5,
                marginBottom: '40px',
              }}
            >
              SRM University AP&apos;s premier engineering guild. We build distributed cloud systems on Azure,
              ship autonomous agentic AI workflows, and organize high-octane national hackathons.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/events/synora-26"
                className="fluent-btn fluent-btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  backgroundColor: 'var(--brand)',
                  color: '#ffffff',
                }}
              >
                <Sparkles size={16} /> Explore SYNORA &apos;26 Flagship &rarr;
              </Link>

              <a
                href="https://discord.gg/microsoft"
                target="_blank"
                rel="noopener noreferrer"
                className="fluent-btn fluent-btn-secondary"
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Join Discord Guild <ExternalLink size={14} />
              </a>

              <Link
                href="/custom-events/synora"
                style={{
                  fontSize: '13px',
                  color: '#a5d0ff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: '8px',
                }}
              >
                View SYNORA F1 Microsite &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & TELEMETRY STRIP */}
      <section
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '24px 0',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '24px',
            }}
          >
            <div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--brand)', display: 'block' }}>
                SYNORA &apos;26
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Flagship National Hackathon</span>
            </div>

            <div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', display: 'block' }}>
                Distributed Scale
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Azure Cloud &amp; Microservices</span>
            </div>

            <div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', display: 'block' }}>
                LLMs &amp; Agents
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cognitive Services &amp; AI</span>
            </div>

            <div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', display: 'block' }}>
                1,200+ Members
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Campus Guild</span>
            </div>

            <div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--success)', display: 'block' }}>
                &#8377; 1.5 Lakhs+
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hackathon Prize Pool</span>
            </div>

            <div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-strong)', display: 'block' }}>
                MLSA Chapter
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Microsoft Ambassadors</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE ECOSYSTEM / PILLARS SECTION (4-Column Microsoft Tile Grid) */}
      <section style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Guiding Engineering Framework
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
              Explore Ecosystem
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '640px', marginTop: '8px' }}>
              Four specialized pillars engineered to elevate student developers from toy projects into production systems.
            </p>
          </div>

          <div className="fluent-grid-4">
            {/* Pillar 1 */}
            <div className="fluent-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Cloud size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                Applied Cloud &amp; AI
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Hands-on immersion with Azure Kubernetes, Serverless compute, Azure OpenAI models, and production RAG pipelines.
              </p>
              <Link href="/events" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Explore Workshops <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="fluent-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Trophy size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                National Hackathons
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Host of flagship national hackathon SYNORA. Fast-paced, competitive sprint building with real industry problem statements.
              </p>
              <Link href="/events/synora-26" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                SYNORA Details <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="fluent-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Terminal size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                Open Source &amp; Tooling
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Collaborative contributions to ecosystem tooling, CLI utilities, and student-first productivity software.
              </p>
              <Link href="/about" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Our Principles <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 4 */}
            <div className="fluent-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                MLSA Leadership
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Mentorship pipeline guiding students to become Microsoft Learn Student Ambassadors and technical speakers.
              </p>
              <Link href="/team" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Meet the Guild <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. UPCOMING EVENTS STRIP */}
      <section style={{ padding: '80px 0', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live Opportunities
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Upcoming Events
              </h2>
            </div>
            <Link href="/events" className="fluent-btn fluent-btn-secondary">
              View All Events &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {upcomingEvents.map((evt) => (
              <div key={evt.id} className="fluent-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={evt.image_url}
                    alt={evt.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {evt.type}
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
                    {evt.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px', flex: 1 }}>
                    {evt.description.slice(0, 140)}...
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--brand)" />
                      <span>{new Date(evt.date_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--brand)" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  <Link
                    href={`/events/${evt.slug}`}
                    className="fluent-btn fluent-btn-primary"
                    style={{ width: '100%' }}
                  >
                    View Details &amp; Register &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CONTACT & INQUIRIES SECTION */}
      <section style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-rest)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            }}
          >
            {/* Contact details */}
            <div style={{ padding: '48px', background: 'var(--bg-tinted)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Get In Touch
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-strong)', margin: '6px 0 16px 0' }}>
                Connect With The MSC Guild
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '32px' }}>
                Whether you represent a technical student club, an industry sponsor, or want to speak at our next
                Azure summit, reach out directly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Official Email:</strong>
                  <a href="mailto:msc.community@srmap.edu.in" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    msc.community@srmap.edu.in
                  </a>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Campus Presence:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>
                    SRM University AP, Neerukonda, Mangalagiri Mandal, Guntur District, Andhra Pradesh 522240
                  </span>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Primary Hub:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Discord Community &bull; Active Engineering Discussions
                  </span>
                </div>
              </div>
            </div>

            {/* Message form */}
            <div style={{ padding: '48px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-strong)' }}>
                Send Us a Message
              </h3>
              <form
                action="mailto:msc.community@srmap.edu.in"
                method="POST"
                encType="text/plain"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="fluent-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@srmap.edu.in"
                    className="fluent-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Subject / Area of Inquiry
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hackathon Sponsorship / Event Collaboration"
                    className="fluent-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about your query..."
                    className="fluent-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="fluent-btn fluent-btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
                >
                  <Send size={15} /> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
