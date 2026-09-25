import React from 'react';
import Link from 'next/link';
import { Award, Compass, Users, MapPin, CheckCircle, Sparkles, Layers, Cpu, Rocket, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'About & Provenance | Microsoft Student Community | SRM University-AP',
  description:
    'The official provenance, charter, and founding history of Microsoft Student Community at SRM University AP. Founded by Jayanth Ramakrishnan, guided by Dr. Murali Krishna Enduri Sir and Dr. CV Tomy Sir.',
};

export default function AboutPage() {
  const manifestoPillars = [
    {
      num: '01',
      title: 'The Vision (Aspiration)',
      statement: 'To position ourselves as a student focused community and create visionaries of tomorrow.',
      colorAccent: '#0067b8',
      tags: ['Impact', 'Innovation', 'Scale'],
      icon: Rocket,
    },
    {
      num: '02',
      title: 'The Mission (Purpose)',
      statement:
        'To provide a student led and student focused platform for interaction and ideas. Committed towards bringing diversity in people and domains.',
      colorAccent: '#107c10',
      tags: ['Interaction', 'Ideas', 'Diversity'],
      icon: Users,
    },
    {
      num: '03',
      title: 'Core Technologies (Stack)',
      statement: 'We utilize industry-standard ecosystems to architect scalable student applications.',
      colorAccent: '#d83b01',
      tags: ['Azure Cloud', 'Open Source', 'AI Integration', 'Web Systems', 'Data Pipelines'],
      icon: Cpu,
    },
  ];

  const journeyPhases = [
    {
      phase: 'Phase I',
      title: 'Foundations (The Past)',
      desc: "The community has successfully led major events providing student focused opportunities with events like HackMSC and Zero Jam which have formed a major part of the community's legacy and strengthen our vision for tomorrow.",
      badge: 'Legacy Milestone',
    },
    {
      phase: 'Phase II',
      title: 'Execution (The Present)',
      desc: 'The community continues in the tradition of the star events while bringing new ideas to diversify student outreach to different courses and specializations. Thus fulfilling the student first commitment.',
      badge: 'Active Chapter',
    },
    {
      phase: 'Phase III',
      title: 'Evolution (The Future)',
      desc: 'The community aims to be the forerunner in student led communities in providing students with opportunities while being transparent in its objective of working for all students and providing support.',
      badge: 'Strategic Vision',
    },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Microsoft Header & Eyebrow */}
        <div style={{ marginBottom: '44px', maxWidth: '880px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              marginBottom: '18px',
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
            <span>MICROSOFT STUDENT COMMUNITY &bull; CHARTER &amp; PROVENANCE</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 600,
              color: 'var(--text-strong)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Empowering every student to achieve more with technology.
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '760px',
            }}
          >
            The official student-led engineering guild at SRM University-AP. We bridge the gap between academic theory and enterprise cloud architectures through hands-on hackathons, research mentorship, and open collaboration.
          </p>
        </div>

        {/* Visual Artwork Feature Container (Microsoft Fluent Frame) */}
        <div
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-rest)',
            marginBottom: '64px',
          }}
        >
          <img
            src="/about_visual.jpg"
            alt="Microsoft Fluent Design and Innovation at SRM University AP"
            style={{
              width: '100%',
              maxHeight: '440px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              padding: '14px 24px',
              background: 'var(--bg-soft)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--brand)" />
              <span style={{ fontWeight: 500, color: 'var(--text-body)' }}>
                Official Student Tech Chapter &bull; SRM University-AP
              </span>
            </div>
            <span>Affiliated with Microsoft Student Communities Network</span>
          </div>
        </div>

        {/* Community Genesis & Provenance Block */}
        <section style={{ marginBottom: '72px' }}>
          <div
            className="fluent-card"
            style={{
              padding: 'clamp(28px, 5vw, 44px)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-rest)',
            }}
          >
            <div style={{ marginBottom: '32px', maxWidth: '780px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--brand)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Institutional Roots
              </span>
              <h2
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 30px)',
                  fontWeight: 600,
                  color: 'var(--text-strong)',
                  marginTop: '6px',
                  letterSpacing: '-0.015em',
                }}
              >
                Origin Story &amp; Provenance
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-body)', marginTop: '12px', lineHeight: 1.65 }}>
                Founded with a mission to create a high-impact technical home for aspiring engineers at SRM University-AP, Microsoft Student Community (MSC) began as a focused group exploring Azure Cloud, distributed architecture, and software design. Guided by departmental leadership, MSC quickly expanded into one of the largest builder collectives on campus, organizing flagship university hackathons, open-source initiatives, and developer conferences.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                gap: '24px',
                borderTop: '1px solid var(--border)',
                paddingTop: '28px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-soft)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Founder &amp; Catalyzer
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0 4px 0' }}>
                  Jayanth Ramakrishnan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Visionary student founder who structured the chapter and laid the cornerstone for campus-wide developer engagement.
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-soft)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#107c10' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Faculty Mentors
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0 4px 0' }}>
                  Dr. Murali Krishna Enduri &amp; Dr. CV Tomy
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Esteemed faculty professors providing institutional governance, research guidance, and university lab resources.
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-soft)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d83b01' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    University Chapter
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0 4px 0' }}>
                  SRM University-AP
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Amaravati, Andhra Pradesh &bull; Dept. of Computer Science &amp; Engineering &bull; Coordinates: 16.46&deg;N 80.50&deg;E
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Manifesto: 3 Foundational Pillars */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--brand)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Guiding Principles
            </span>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.5vw, 32px)',
                fontWeight: 600,
                color: 'var(--text-strong)',
                marginTop: '4px',
                letterSpacing: '-0.015em',
              }}
            >
              The 3 Foundational Pillars
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
              Modeled after enterprise engineering practices, our charter defines how we innovate, collaborate, and support student developers.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '24px',
            }}
          >
            {manifestoPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.num}
                  className="fluent-card"
                  style={{
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    borderTop: `3px solid ${pillar.colorAccent}`,
                    boxShadow: 'var(--shadow-rest)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          background: 'var(--bg-soft)',
                          color: pillar.colorAccent,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '24px',
                          fontWeight: 700,
                          color: 'var(--border-strong)',
                          opacity: 0.35,
                          fontFamily: 'monospace',
                        }}
                      >
                        {pillar.num}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '19px',
                        fontWeight: 600,
                        color: 'var(--text-strong)',
                        marginBottom: '12px',
                      }}
                    >
                      {pillar.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        lineHeight: 1.65,
                        marginBottom: '28px',
                      }}
                    >
                      &ldquo;{pillar.statement}&rdquo;
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '16px',
                    }}
                  >
                    {pillar.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          background: 'var(--bg-soft)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          color: 'var(--text-body)',
                          fontWeight: 500,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* The Journey: Chronicle Timeline */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--brand)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Chronicle Timeline
            </span>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.5vw, 32px)',
                fontWeight: 600,
                color: 'var(--text-strong)',
                marginTop: '4px',
                letterSpacing: '-0.015em',
              }}
            >
              The Chapter Evolution
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '640px', marginTop: '8px' }}>
              Tracing our journey from early technical meetups to large-scale university hackathons and industry collaborations.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              borderLeft: '2px solid var(--border)',
              paddingLeft: '28px',
              marginLeft: '12px',
            }}
          >
            {journeyPhases.map((phase, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-rest)',
                }}
              >
                {/* Node pin */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-36px',
                    top: '24px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    border: '3px solid var(--bg)',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--brand)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {phase.phase}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'var(--bg-soft)',
                      border: '1px solid var(--border)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {phase.badge}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 600,
                    color: 'var(--text-strong)',
                    marginBottom: '8px',
                  }}
                >
                  {phase.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '780px' }}>
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Direct Action Ribbon */}
        <section>
          <div
            style={{
              padding: 'clamp(28px, 4vw, 40px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-rest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '6px' }}>
                Join the MSC Developer Community
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '580px' }}>
                Participate in upcoming Azure bootcamps, compete in campus hackathons, or collaborate on open-source projects.
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
                Explore Events Directory <ArrowRight size={14} />
              </Link>
              <Link
                href="/team"
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
                Meet The Leadership
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
