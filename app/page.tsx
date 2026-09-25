import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  Cloud,
  Terminal,
  Trophy,
  Users,
  Award,
  Calendar,
  MapPin,
  Send,
  ShieldCheck,
} from 'lucide-react';
import TelemetryMarquee from '@/components/TelemetryMarquee';
import { FALLBACK_EVENTS, EventItem } from '@/lib/data/mock-fallback';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let allEvents: EventItem[] = FALLBACK_EVENTS;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('date_start', { ascending: false });

    if (!error && data && data.length > 0) {
      allEvents = data as EventItem[];
    }
  } catch (err) {
    console.warn('Home events query fallback:', err);
  }

  const upcomingEvents = allEvents.filter((e) => e.status === 'upcoming');
  const flagship =
    allEvents.find((e) => e.slug === 'synora-26' || e.slug === 'synora') ||
    upcomingEvents[0] ||
    allEvents[0];

  return (
    <div>
      {/* 1. CINEMATIC HERO SECTION WITH OFFICIAL WINDOWS FLOW WALLPAPER */}
      <section
        style={{
          backgroundColor: '#040b14',
          color: 'var(--text-on-dark)',
          padding: '110px 0 90px 0',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Background Wallpaper Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/hero-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Dark Gradient Overlay for text contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(4, 11, 20, 0.94) 0%, rgba(4, 11, 20, 0.80) 48%, rgba(4, 11, 20, 0.35) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '860px' }}>
            {/* Headline */}
            <h1
              className="display-hero"
              style={{
                color: '#ffffff',
                marginBottom: '24px',
                fontWeight: 600,
              }}
            >
              Where Student Builders Architect the Future.
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
              SRM University AP&apos;s premier engineering collective powered by Microsoft Learn Student Ambassadors. We engineer scalable cloud platforms, accelerate applied AI, and compete across national hackathons.
            </p>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="https://discord.gg/K5NC5wAhg"
                target="_blank"
                rel="noopener noreferrer"
                className="fluent-btn fluent-btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  backgroundColor: 'var(--brand)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>Join Discord Guild</span>
                <span
                  style={{
                    background: '#0e7c41',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontWeight: 700,
                  }}
                >
                  1,200+ ONLINE
                </span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFINITE TELEMETRY TICKER MARQUEE */}
      <TelemetryMarquee />

      {/* 3. ECOSYSTEM PILLARS (#ecosystem) - 3 Numbered Domain Cards */}
      <section id="ecosystem" style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Guiding Engineering Framework
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
              Built for serious student developers.
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '640px', marginTop: '8px' }}>
              Three specialized engineering disciplines elevating student developers from local experiments into production-grade systems.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
            {/* Pillar 01 */}
            <div className="fluent-card" style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cloud size={24} />
                </div>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--border-strong)', opacity: 0.4 }}>
                  01
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-strong)' }}>
                Applied Cloud &amp; AI
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                Hands-on systems engineering, Microsoft Azure deployments, and production LLM orchestration workshops built for real scale.
              </p>
              <Link href="/events" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Explore Cloud Workshops <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 02 */}
            <div className="fluent-card" style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={24} />
                </div>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--border-strong)', opacity: 0.4 }}>
                  02
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-strong)' }}>
                National Hackathons
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                Organizing high-stakes hackathons like Solutions for Smart India, uniting hundreds of student innovators to solve hard problems.
              </p>
              <Link href="/events/synora-26" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                SYNORA &apos;26 Details <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 03 */}
            <div className="fluent-card" style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Terminal size={24} />
                </div>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--border-strong)', opacity: 0.4 }}>
                  03
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-strong)' }}>
                Mentorship &amp; Open Source
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                Direct mentorship from Microsoft MVP alumni, senior student engineers, and peer code reviews for production open-source tools.
              </p>
              <Link href="/about" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Our Chapter Mission <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. UPCOMING EVENT SPOTLIGHT (#upcoming) */}
      <section id="upcoming" style={{ padding: '80px 0', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Featured Engineering Sprint
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Upcoming Event Spotlight
              </h2>
            </div>
            <Link href="/events" className="fluent-btn fluent-btn-secondary">
              View All Directory Events &rarr;
            </Link>
          </div>

          {/* Spotlight Card */}
          <div
            className="fluent-showcase-card"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              marginBottom: '36px',
              background: 'var(--surface)',
            }}
          >
            <div style={{ minHeight: '260px', position: 'relative', overflow: 'hidden', padding: '16px' }}>
              <div style={{ width: '100%', height: '100%', minHeight: '240px', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={flagship.image_url}
                  alt={flagship.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  SEP 17
                </div>
              </div>
            </div>

            <div style={{ padding: 'clamp(24px, 4vw, 44px) clamp(16px, 4vw, 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <span className="fluent-badge badge-warning" style={{ fontWeight: 800, letterSpacing: '0.05em', borderRadius: '6px' }}>
                  SEP 17
                </span>
                <span className="fluent-badge badge-success" style={{ borderRadius: '6px' }}>Registration Open</span>
                <span className="fluent-badge badge-info" style={{ borderRadius: '6px' }}>&#8377; 30,000+ Bounty Pool</span>
              </div>

              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-strong)', marginBottom: '12px' }}>
                SYNORA
              </h3>

              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                It is a fresher-oriented 18-hour technology event that combines 6 hours of orientation and technical talks with a 12-hour intensive hackathon, giving students a complete experience of learning, collaboration, and hands-on project building.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-body)', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="var(--brand)" />
                  <span>September 17, 2026 &bull; 18-Hour Sprint</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="var(--brand)" />
                  <span>{flagship.location}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href={`/events/${flagship.slug}`}
                  className="fluent-btn fluent-btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '8px' }}
                >
                  Enter Event Portal &rarr;
                </Link>
                <Link
                  href="/custom-events/synora"
                  className="fluent-btn fluent-btn-secondary"
                  style={{ padding: '12px 20px', fontSize: '15px', borderRadius: '8px' }}
                >
                  F1 Interactive Microsite
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT SECTION (#contact) */}
      <section id="contact" style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div
            className="fluent-showcase-card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            }}
          >
            {/* Contact details */}
            <div style={{ padding: 'clamp(28px, 4vw, 48px) clamp(18px, 4vw, 44px)', background: 'var(--bg-tinted)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Official Line
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-strong)', margin: '6px 0 16px 0' }}>
                Connect With The MSC Lead Team
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '32px' }}>
                Whether you represent an institutional club, an industry partner, or want to speak at our next
                Azure cloud conference, reach out directly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Official Community Email:</strong>
                  <a href="mailto:msc.community@srmap.edu.in" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    msc.community@srmap.edu.in
                  </a>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Campus Headquarters:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>
                    SRM University AP, Neerukonda, Mangalagiri Mandal, Guntur District, Andhra Pradesh 522240
                  </span>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Primary Community Channel:</strong>
                  <a href="https://discord.gg/microsoft" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    Join Discord Server (Active 24/7)
                  </a>
                </div>
              </div>
            </div>

            {/* Message form via Web3Forms API relay */}
            <div style={{ padding: 'clamp(28px, 4vw, 48px) clamp(18px, 4vw, 44px)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-strong)' }}>
                Send Us a Message
              </h3>
              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Web3Forms public access key placeholder */}
                <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY" />
                <input type="hidden" name="subject" value="New Inquiry from MSC SRM AP Platform" />
                <input type="hidden" name="from_name" value="MSC Public Portal" />

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="fluent-input"
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@srmap.edu.in"
                    className="fluent-input"
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Inquiry Topic
                  </label>
                  <input
                    type="text"
                    name="topic"
                    required
                    placeholder="e.g. Hackathon Sponsorship / Event Collaboration"
                    className="fluent-input"
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    required
                    placeholder="Provide details about your query..."
                    className="fluent-input"
                    style={{ resize: 'vertical', borderRadius: '8px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="fluent-btn fluent-btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '12px 28px', borderRadius: '8px' }}
                >
                  <Send size={15} /> Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
