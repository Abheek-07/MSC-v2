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
  Code,
  BookOpen,
  Sparkles,
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
    console.warn('Using fallback events catalog:', err);
  }

  const upcomingList = allEvents.filter((e) => e.status === 'upcoming');
  const flagship = upcomingList[0] || allEvents[0];

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-body)', fontFamily: 'var(--font-family)' }}>
      {/* 1. AUTHENTIC MICROSOFT FLUENT HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: 'clamp(80px, 12vw, 130px) 0 clamp(70px, 10vw, 110px) 0',
          overflow: 'hidden',
          backgroundColor: '#05111c',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Background Artwork */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/hero_bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
          }}
        />

        {/* Ambient Dark Gradient Overlay for optimal contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(5, 17, 28, 0.95) 0%, rgba(5, 17, 28, 0.82) 50%, rgba(5, 17, 28, 0.40) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '840px' }}>
            {/* Microsoft Brand Eyebrow with 4-Color Tiles */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '4px',
                marginBottom: '24px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
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
              <span>MICROSOFT STUDENT COMMUNITY &bull; SRM AP CHAPTER &apos;26</span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(36px, 5.5vw, 56px)',
                fontWeight: 600,
                lineHeight: 1.15,
                color: '#ffffff',
                marginBottom: '20px',
                letterSpacing: '-0.02em',
              }}
            >
              Where Student Builders Architect the Future.
            </h1>

            {/* Sub-headline */}
            <p
              style={{
                fontSize: 'clamp(16px, 2.2vw, 18px)',
                color: 'rgba(255, 255, 255, 0.85)',
                maxWidth: '680px',
                lineHeight: 1.6,
                marginBottom: '36px',
              }}
            >
              SRM University AP&apos;s official Microsoft Student Community chapter. We engineer scalable cloud applications on Azure, build open-source systems, and host national hackathons.
            </p>

            {/* Microsoft Primary Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/events"
                className="fluent-btn fluent-btn-primary"
                style={{
                  padding: '11px 26px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: 'var(--brand)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Explore Events</span>
                <ArrowRight size={15} />
              </Link>

              <a
                href="https://discord.gg/K5NC5wAhg"
                target="_blank"
                rel="noopener noreferrer"
                className="fluent-btn fluent-btn-secondary"
                style={{
                  padding: '11px 22px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Join Discord Guild</span>
                <span
                  style={{
                    background: '#107c10',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontWeight: 700,
                  }}
                >
                  1,200+
                </span>
                <ExternalLink size={13} />
              </a>

              <Link
                href="/about"
                style={{
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px',
                }}
              >
                <span>Our Charter &amp; Mission &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFINITE TELEMETRY MARQUEE */}
      <TelemetryMarquee />

      {/* 3. ENGINEERING PILLARS - Microsoft Solution Architecture Style */}
      <section id="ecosystem" style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Guiding Engineering Framework
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px', letterSpacing: '-0.01em' }}>
              Built for student developers who ship.
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '640px', marginTop: '8px', lineHeight: 1.6 }}>
              Three specialized engineering disciplines elevating student developers from local experiments into production-grade systems.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
            {/* Pillar 01 */}
            <div
              className="fluent-card"
              style={{
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cloud size={22} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  01
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                Applied Cloud &amp; AI
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Hands-on systems engineering, Microsoft Azure deployments, and production LLM orchestration workshops built for real scale.
              </p>
              <Link href="/events" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                Explore Cloud Workshops <ArrowRight size={13} />
              </Link>
            </div>

            {/* Pillar 02 */}
            <div
              className="fluent-card"
              style={{
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={22} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  02
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                National Hackathons
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Organizing high-stakes hackathons like Solutions for Smart India and SYNORA, uniting hundreds of student innovators.
              </p>
              <Link href="/events" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                View Hackathons <ArrowRight size={13} />
              </Link>
            </div>

            {/* Pillar 03 */}
            <div
              className="fluent-card"
              style={{
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Terminal size={22} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  03
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-strong)' }}>
                Mentorship &amp; Open Source
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                Direct mentorship from Microsoft MVP alumni, senior student engineers, and peer code reviews for production open-source tools.
              </p>
              <Link href="/about" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                Our Chapter Mission <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. UPCOMING EVENT SPOTLIGHT (#upcoming) */}
      <section id="upcoming" style={{ padding: '80px 0', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Featured Engineering Sprint
              </span>
              <h2 style={{ fontSize: '30px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px', letterSpacing: '-0.01em' }}>
                Upcoming Event Spotlight
              </h2>
            </div>
            <Link
              href="/events"
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--brand)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All Directory Events &rarr;
            </Link>
          </div>

          {/* Spotlight Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              background: 'var(--surface)',
            }}
          >
            <div style={{ minHeight: '260px', position: 'relative', overflow: 'hidden', background: '#0a0a0c' }}>
              <img
                src={flagship.image_url}
                alt={flagship.title}
                style={{ width: '100%', height: '100%', minHeight: '260px', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                SEP 17
              </div>
            </div>

            <div style={{ padding: 'clamp(24px, 4vw, 36px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="fluent-badge badge-success" style={{ borderRadius: '4px' }}>Registration Open</span>
                <span className="fluent-badge badge-info" style={{ borderRadius: '4px' }}>&#8377; 30,000+ Bounty Pool</span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '10px' }}>
                SYNORA
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                An 18-hour technology sprint combining foundational talks with a 12-hour intensive hackathon, giving students a complete experience of learning, collaboration, and shipping software.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-body)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="var(--brand)" />
                  <span>September 17, 2026 &bull; 18-Hour Sprint</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="var(--brand)" />
                  <span>{flagship.location}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href={`/events/${flagship.slug}`}
                  className="fluent-btn fluent-btn-primary"
                  style={{ padding: '9px 24px', fontSize: '13.5px', borderRadius: '4px' }}
                >
                  Enter Event Portal &rarr;
                </Link>
                <Link
                  href="/custom-events/synora"
                  className="fluent-btn fluent-btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '13.5px', borderRadius: '4px' }}
                >
                  F1 Interactive Microsite
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. IMPACT TELEMETRY - Microsoft Metrics Strip */}
      <section style={{ padding: '60px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: 'var(--brand)', letterSpacing: '-0.02em' }}>
                1,200+
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Active Student Members
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Across engineering disciplines
              </div>
            </div>

            <div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: 'var(--brand)', letterSpacing: '-0.02em' }}>
                18+
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Hackathons &amp; Summits
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                National and campus sprints
              </div>
            </div>

            <div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: 'var(--brand)', letterSpacing: '-0.02em' }}>
                45+
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Technical Workshops
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Azure, AI, Web &amp; Security
              </div>
            </div>

            <div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: 'var(--brand)', letterSpacing: '-0.02em' }}>
                100%
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Student-Run Chapter
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Supported by faculty mentors
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT & PARTNERSHIPS */}
      <section id="contact" style={{ padding: '80px 0', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            }}
          >
            {/* Contact details */}
            <div style={{ padding: 'clamp(28px, 4vw, 44px)', background: 'var(--bg-tinted)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Official Line
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', margin: '6px 0 14px 0' }}>
                Connect With The MSC Lead Team
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '28px' }}>
                Whether you represent an institutional club, an industry partner, or want to speak at our next
                Azure cloud conference, reach out directly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Official Community Email:</strong>
                  <a href="mailto:msc.community@srmap.edu.in" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
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
                  <strong style={{ display: 'block', color: 'var(--text-strong)' }}>Discord Community:</strong>
                  <a href="https://discord.gg/K5NC5wAhg" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                    Join Discord Server (Active 24/7)
                  </a>
                </div>
              </div>
            </div>

            {/* Message form */}
            <div style={{ padding: 'clamp(28px, 4vw, 44px)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-strong)' }}>
                Send Us a Message
              </h3>
              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY" />
                <input type="hidden" name="subject" value="New Inquiry from MSC SRM AP Platform" />
                <input type="hidden" name="from_name" value="MSC Public Portal" />

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-strong)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="fluent-input"
                    style={{ borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-strong)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@srmap.edu.in"
                    className="fluent-input"
                    style={{ borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-strong)' }}>
                    Inquiry Topic
                  </label>
                  <input
                    type="text"
                    name="topic"
                    required
                    placeholder="e.g. Hackathon Sponsorship / Event Collaboration"
                    className="fluent-input"
                    style={{ borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-strong)' }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    required
                    placeholder="Provide details about your query..."
                    className="fluent-input"
                    style={{ resize: 'vertical', borderRadius: '4px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="fluent-btn fluent-btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '9px 24px', borderRadius: '4px', fontSize: '13.5px' }}
                >
                  <Send size={14} /> Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
